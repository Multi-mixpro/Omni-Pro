begin;

-- Keep every publication within the task unit and all selected platforms.
-- Touch the task version for partial publication too, preventing stale saves.
create or replace function public.record_creative_publication(p_task uuid, p_account uuid, p_url text, p_published_at timestamptz, p_version timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype; a public.creative_accounts%rowtype; publication uuid;
begin
  if not (public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin'))) then
    raise exception 'Tidak memiliki izin mencatat publikasi.' using errcode='42501';
  end if;
  select * into t from public.creative_tasks where id=p_task and deleted_at is null for update;
  if not found or t.updated_at is distinct from p_version then raise exception 'Tugas berubah. Segarkan sebelum mencoba lagi.' using errcode='40001'; end if;
  if t.status not in ('ready','done') or t.platform='internal' or t.workstream='operations' or t.source_activation_id is not null then
    raise exception 'Tugas ini belum siap atau tidak memerlukan publikasi.';
  end if;
  select * into a from public.creative_accounts where id=p_account and is_active for share;
  if not found or t.business_unit_id is distinct from a.business_unit_id then raise exception 'Pilih akun aktif dari unit tugas yang sama.'; end if;
  if not a.platform = any(array_prepend(t.platform, t.additional_platforms)) then
    raise exception 'Pilih akun dari salah satu platform tugas.';
  end if;
  if p_published_at is null or p_published_at > now() then raise exception 'Gunakan waktu publikasi aktual, bukan jadwal mendatang.'; end if;
  insert into public.creative_publications(task_id,account_id,published_url,published_at,recorded_by)
  values(p_task,p_account,trim(p_url),p_published_at,auth.uid()) returning id into publication;
  update public.creative_tasks set status = case when not exists (
    select 1 from unnest(array_prepend(t.platform, t.additional_platforms)) as required(platform)
    where not exists (
      select 1 from public.creative_publications p
      join public.creative_accounts account on account.id = p.account_id
      where p.task_id = p_task and account.platform = required.platform
    )
  ) then 'done' else t.status end, blocker='' where id=p_task;
  insert into public.creative_task_events(task_id,kind,detail,actor_id)
  values (p_task,'publication',a.platform || ' · ' || a.handle,auth.uid());
  return publication;
end $$;

commit;
