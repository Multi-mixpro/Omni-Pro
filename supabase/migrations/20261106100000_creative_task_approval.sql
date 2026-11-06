begin;

alter table public.creative_tasks
  add column approver_id uuid references public.profiles(id) on delete set null,
  add column approved_at timestamptz;

create function public.guard_creative_task_approval()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.approved_at := null;
    if new.approver_id is not null and new.status = 'done' then
      raise exception 'Tugas memerlukan persetujuan sebelum diselesaikan.';
    end if;
  else
    if new.approver_id is distinct from old.approver_id then
      if (old.approver_id is not null or old.status in ('ready', 'done'))
        and not public.has_permission('launch.admin')
        and (new.approver_id is not null or exists (select 1 from public.profiles where id = old.approver_id)) then
        raise exception 'Hanya admin yang dapat mengganti pemberi persetujuan yang sudah ditugaskan.' using errcode = '42501';
      end if;
      if new.approver_id is not null and new.status = 'done' then
        raise exception 'Buka kembali tugas sebelum mengganti pemberi persetujuan.';
      end if;
      new.approved_at := null;
    elsif new.approved_at is distinct from old.approved_at then
      if old.status <> 'ready' or new.status <> 'ready' or new.approver_id is null
        or auth.uid() is distinct from new.approver_id or old.approved_at is not null
        or new.approved_at is null then
        raise exception 'Persetujuan hanya dapat dicatat oleh pemberi persetujuan yang ditugaskan.' using errcode = '42501';
      end if;
      new.approved_at := now();
    end if;
  end if;

  if new.approver_id is not null and (tg_op = 'INSERT' or new.approver_id is distinct from old.approver_id)
    and not exists (select 1 from public.profiles where id = new.approver_id and is_active) then
    raise exception 'Pilih pemberi persetujuan yang masih aktif.';
  end if;
  if new.status not in ('ready', 'done') then
    new.approved_at := null;
  end if;
  if new.status = 'done' and new.approver_id is not null and new.approved_at is null then
    raise exception 'Tugas memerlukan persetujuan sebelum diselesaikan.';
  end if;
  return new;
end;
$$;

create trigger creative_task_approval_guard
before insert or update of status, approver_id, approved_at on public.creative_tasks
for each row execute function public.guard_creative_task_approval();

create function public.guard_creative_publication_approval()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  task public.creative_tasks%rowtype;
begin
  select * into task from public.creative_tasks where id = new.task_id for share;
  if not found then
    raise exception 'Tugas publikasi tidak dapat diakses.' using errcode = '42501';
  end if;
  if task.approver_id is not null and task.approved_at is null then
    raise exception 'Tunggu persetujuan sebelum mencatat bukti tayang.';
  end if;
  return new;
end;
$$;

create trigger creative_publication_approval_guard
before insert on public.creative_publications
for each row execute function public.guard_creative_publication_approval();

commit;
