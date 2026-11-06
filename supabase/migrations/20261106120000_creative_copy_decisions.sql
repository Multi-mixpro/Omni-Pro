begin;

create table public.creative_copy_decisions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.creative_copy_versions(id) on delete cascade,
  stage text not null check (stage in ('review', 'approval')),
  outcome text not null check (outcome in ('accepted', 'changes_requested')),
  note text not null default '' check (char_length(note) <= 1000),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz not null default now(),
  unique (version_id, stage),
  check (outcome <> 'changes_requested' or btrim(note) <> '')
);

alter table public.creative_copy_decisions enable row level security;
revoke all on public.creative_copy_decisions from public, anon, authenticated;
grant select, insert on public.creative_copy_decisions to authenticated;

create policy creative_copy_decisions_read on public.creative_copy_decisions
for select to authenticated using (
  exists (select 1 from public.creative_copy_versions v where v.id = creative_copy_decisions.version_id)
);

create policy creative_copy_decisions_insert on public.creative_copy_decisions
for insert to authenticated with check (
  decided_by = (select auth.uid())
  and exists (select 1 from public.creative_copy_versions v where v.id = creative_copy_decisions.version_id)
);

create function public.guard_creative_copy_decision()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  task public.creative_tasks%rowtype;
  assigned_user uuid;
  review_outcome text;
begin
  if not public.is_active_user() or not (public.has_permission('creative.edit') or public.has_permission('launch.admin')) then
    raise exception 'Anda tidak dapat mencatat keputusan copy.' using errcode = '42501';
  end if;

  -- Serialize decisions and changes to reviewer assignments on the task row.
  select t.* into task from public.creative_copy_versions v
  join public.creative_tasks t on t.id = v.task_id
  where v.id = new.version_id for update of t;
  if not found then
    raise exception 'Versi copy tidak dapat diakses.' using errcode = '42501';
  end if;

  assigned_user := case new.stage when 'review' then task.reviewer_id when 'approval' then task.approver_id end;
  if assigned_user is null or assigned_user is distinct from auth.uid() then
    raise exception 'Keputusan hanya dapat dicatat oleh akun yang ditugaskan.' using errcode = '42501';
  end if;

  if new.stage = 'approval' then
    select outcome into review_outcome from public.creative_copy_decisions
    where version_id = new.version_id and stage = 'review';
    if review_outcome = 'changes_requested'
      or (task.reviewer_id is not null and review_outcome is distinct from 'accepted') then
      raise exception 'Versi ini belum lulus review. Simpan revisi sebagai versi baru jika perubahan diminta.';
    end if;
  elsif exists (select 1 from public.creative_copy_decisions where version_id = new.version_id and stage = 'approval') then
    raise exception 'Keputusan akhir untuk versi ini sudah tercatat.';
  end if;

  new.note := btrim(new.note);
  new.decided_by := auth.uid();
  new.decided_at := now();
  return new;
end;
$$;

create trigger creative_copy_decision_guard before insert on public.creative_copy_decisions
for each row execute function public.guard_creative_copy_decision();

commit;
