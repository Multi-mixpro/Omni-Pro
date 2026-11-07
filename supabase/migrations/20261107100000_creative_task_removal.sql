begin;

alter table public.creative_tasks
  add column deleted_at timestamptz,
  add column deleted_by uuid,
  add column deleted_source_idea_id uuid,
  add column deleted_source_activation_id uuid;

-- Hide removed tasks from active work, while retaining their related records.
create policy creative_tasks_active_only on public.creative_tasks
  as restrictive for all to authenticated
  using (deleted_at is null)
  with check (
    deleted_at is null and deleted_by is null
    and deleted_source_idea_id is null and deleted_source_activation_id is null
  );

create function public.remove_creative_task(p_task uuid, p_version timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not coalesce(
    public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin')),
    false
  ) then
    raise exception 'Anda tidak memiliki izin menghapus tugas.' using errcode = '42501';
  end if;

  update public.creative_tasks
  set deleted_at = now(), deleted_by = auth.uid(),
      deleted_source_idea_id = source_idea_id, source_idea_id = null,
      deleted_source_activation_id = source_activation_id, source_activation_id = null
  where id = p_task and updated_at = p_version and deleted_at is null;

  if not found then
    raise exception 'Tugas sudah berubah atau dihapus. Segarkan daftar sebelum mencoba lagi.'
      using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.remove_creative_task(uuid,timestamptz) from public, anon;
grant execute on function public.remove_creative_task(uuid,timestamptz) to authenticated;

-- The publication RPC bypasses RLS; prevent it from completing a removed task.
create function public.guard_removed_creative_task()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Tugas sudah dihapus.' using errcode = '40001';
end;
$$;

create trigger creative_task_removed_status_guard
before update of status on public.creative_tasks
for each row when (old.deleted_at is not null)
execute function public.guard_removed_creative_task();

create or replace function public.nudge_creative_task(p_task uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype;
begin
  if not (public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin'))) then
    raise exception 'Tidak memiliki izin meminta tindak lanjut.' using errcode = '42501';
  end if;
  select * into t from public.creative_tasks where id = p_task and deleted_at is null for share;
  if not found or t.assignee_id is null or t.status in ('done','cancelled') then
    raise exception 'Tindak lanjut memerlukan tugas aktif dengan PIC.';
  end if;
  insert into public.creative_task_events(task_id,kind,detail,actor_id,recipient_id)
  values (t.id,'nudge','Mohon perbarui progres dan catat hambatan bila ada.',auth.uid(),t.assignee_id)
  on conflict do nothing;
  return found;
end;
$$;

commit;
