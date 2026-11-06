begin;

alter table public.creative_tasks
  add column deliverable text not null default '' check (char_length(deliverable) <= 1000),
  add column acceptance_criteria text not null default '' check (char_length(acceptance_criteria) <= 2000),
  add column completion_note text not null default '' check (char_length(completion_note) <= 2000),
  add column requires_completion_evidence boolean not null default false;

alter table public.creative_tasks alter column requires_completion_evidence set default true;

create function public.guard_creative_task_completion_requirements()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.requires_completion_evidence := new.source_activation_id is null;
  else
    new.requires_completion_evidence := old.requires_completion_evidence;
  end if;

  if new.requires_completion_evidence and new.status in ('doing', 'review', 'ready', 'done') then
    if new.assignee_id is null or new.due_on is null
      or btrim(new.deliverable) = '' or btrim(new.acceptance_criteria) = '' then
      raise exception 'Isi PIC utama, deadline, hasil yang harus diserahkan, dan kriteria penerimaan sebelum melanjutkan.';
    end if;
    if new.status in ('review', 'ready', 'done') and btrim(new.completion_note) = ''
      and btrim(coalesce(new.output_url, '')) = ''
      and not exists (select 1 from public.creative_publications p where p.task_id = new.id) then
      raise exception 'Lampirkan tautan hasil atau isi catatan bukti sebelum melanjutkan.';
    end if;
  end if;
  if new.status = 'done' and new.workstream <> 'operations' and new.source_activation_id is null
    and cardinality(new.additional_platforms) > 0
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
    and exists (
      select 1 from unnest(array_prepend(new.platform, new.additional_platforms)) as required(platform)
      where not exists (
        select 1 from public.creative_publications p
        join public.creative_accounts account on account.id = p.account_id
        where p.task_id = new.id and account.platform = required.platform
      )
    ) then
    raise exception 'Catat bukti tayang untuk setiap platform sebelum menyelesaikan tugas.';
  end if;
  return new;
end;
$$;

-- Limit validation to workflow changes so unrelated writes and FK cleanup still work.
create trigger creative_task_completion_requirements_guard
before insert or update of status, deliverable, acceptance_criteria, completion_note, output_url,
  requires_completion_evidence on public.creative_tasks
for each row execute function public.guard_creative_task_completion_requirements();

create or replace function public.record_creative_publication(p_task uuid, p_account uuid, p_url text, p_published_at timestamptz, p_version timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype; a public.creative_accounts%rowtype; publication uuid;
begin
  if not (public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin'))) then
    raise exception 'Tidak memiliki izin mencatat publikasi.' using errcode='42501';
  end if;
  select * into t from public.creative_tasks where id=p_task for update;
  if not found or t.updated_at is distinct from p_version then raise exception 'Tugas berubah. Segarkan sebelum mencoba lagi.' using errcode='40001'; end if;
  if t.status not in ('ready','done') or t.platform='internal' or t.workstream='operations' or t.source_activation_id is not null then
    raise exception 'Tugas ini belum siap atau tidak memerlukan publikasi.';
  end if;
  select * into a from public.creative_accounts where id=p_account and is_active for share;
  if not found or t.business_unit_id is distinct from a.business_unit_id then raise exception 'Pilih akun aktif dari unit tugas yang sama.'; end if;
  if cardinality(t.additional_platforms) > 0 and a.platform <> t.platform
    and not a.platform = any(t.additional_platforms) then
    raise exception 'Pilih akun dari salah satu platform tugas.';
  end if;
  if p_published_at is null or p_published_at > now() then raise exception 'Gunakan waktu publikasi aktual, bukan jadwal mendatang.'; end if;
  insert into public.creative_publications(task_id,account_id,published_url,published_at,recorded_by)
  values(p_task,p_account,trim(p_url),p_published_at,auth.uid()) returning id into publication;
  if cardinality(t.additional_platforms) = 0 or not exists (
    select 1 from unnest(array_prepend(t.platform, t.additional_platforms)) as required(platform)
    where not exists (
      select 1 from public.creative_publications p
      join public.creative_accounts account on account.id = p.account_id
      where p.task_id = p_task and account.platform = required.platform
    )
  ) then
    update public.creative_tasks set status='done', blocker='' where id=p_task;
  end if;
  insert into public.creative_task_events(task_id,kind,detail,actor_id)
  values (p_task,'publication',a.platform || ' · ' || a.handle,auth.uid());
  return publication;
end $$;

commit;
