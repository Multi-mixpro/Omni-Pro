begin;

alter table public.creative_tasks
  add column reviewer_id uuid references public.profiles(id) on delete set null,
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz;

create function public.guard_creative_task_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.reviewer_id is not null and (tg_op = 'INSERT' or new.reviewer_id is distinct from old.reviewer_id)
    and not exists (select 1 from public.profiles where id = new.reviewer_id and is_active) then
    raise exception 'Pilih reviewer yang masih aktif.';
  end if;
  if tg_op = 'INSERT' then
    new.reviewed_by := null;
    new.reviewed_at := null;
    if new.reviewer_id is not null and new.status in ('ready', 'done') then
      raise exception 'Ajukan tugas untuk review sebelum menandai siap atau selesai.';
    end if;
    return new;
  end if;

  -- A foreign key can clear an account that has been deleted.
  if new.reviewed_by is distinct from old.reviewed_by
    and (new.reviewed_by is not null or exists (select 1 from public.profiles where id = old.reviewed_by)) then
    raise exception 'Pencatat review ditentukan oleh sistem.';
  end if;
  new.reviewed_at := old.reviewed_at;

  if new.reviewer_id is distinct from old.reviewer_id then
    if (old.reviewer_id is not null or old.status in ('review', 'ready', 'done')) and not public.has_permission('launch.admin')
      and (new.reviewer_id is not null or exists (select 1 from public.profiles where id = old.reviewer_id)) then
      raise exception 'Hanya admin yang dapat mengganti reviewer yang sudah ditugaskan.';
    end if;
    if new.reviewer_id is not null and new.status in ('ready', 'done') then
      raise exception 'Kembalikan tugas ke review untuk mengganti reviewer.';
    end if;
  end if;

  if old.status = 'review' and new.status in ('doing', 'ready') and old.reviewer_id is not null
    and auth.uid() is distinct from old.reviewer_id then
    raise exception 'Keputusan review hanya dapat dicatat oleh reviewer yang ditugaskan.' using errcode = '42501';
  end if;

  if old.status is distinct from new.status then
    if new.status = 'ready' and new.reviewer_id is not null then
      if old.status <> 'review' or auth.uid() is distinct from new.reviewer_id then
        raise exception 'Reviewer harus menyetujui tugas dari status Review.';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    elsif new.status = 'done' and new.reviewer_id is not null then
      if old.status <> 'ready' or old.reviewed_at is null or old.reviewed_by is distinct from new.reviewer_id then
        raise exception 'Selesaikan review sebelum menutup tugas.';
      end if;
    elsif new.status not in ('ready', 'done') then
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger creative_task_reviewer_guard
before insert or update of reviewer_id, reviewed_by, reviewed_at, status on public.creative_tasks
for each row execute function public.guard_creative_task_review();

commit;
