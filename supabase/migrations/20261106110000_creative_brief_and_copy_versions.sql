begin;

alter table public.creative_tasks
  add column creative_brief jsonb not null default '{}'::jsonb
  check (jsonb_typeof(creative_brief) = 'object' and octet_length(creative_brief::text) <= 32000);

create table public.creative_copy_versions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.creative_tasks(id) on delete cascade,
  version integer not null check (version > 0),
  format text not null check (format in ('caption', 'hook', 'script', 'listing', 'ad', 'other')),
  body text not null check (char_length(btrim(body)) between 1 and 12000),
  change_note text not null default '' check (char_length(change_note) <= 1000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id, version)
);

alter table public.creative_copy_versions enable row level security;
revoke all on public.creative_copy_versions from public, anon, authenticated;
grant select, insert on public.creative_copy_versions to authenticated;

create policy creative_copy_read on public.creative_copy_versions
for select to authenticated using (
  exists (select 1 from public.creative_tasks task where task.id = creative_copy_versions.task_id)
);

create policy creative_copy_append on public.creative_copy_versions
for insert to authenticated with check (
  created_by = (select auth.uid())
  and ((select public.has_permission('creative.edit')) or (select public.has_permission('launch.admin')))
  and exists (select 1 from public.creative_tasks task where task.id = creative_copy_versions.task_id)
);

create function public.number_creative_copy_version()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not (public.has_permission('creative.edit') or public.has_permission('launch.admin')) then
    raise exception 'Anda tidak dapat menambahkan versi copy.' using errcode = '42501';
  end if;
  perform 1 from public.creative_tasks where id = new.task_id for update;
  if not found then
    raise exception 'Tugas tidak dapat diakses.' using errcode = '42501';
  end if;
  select coalesce(max(copy.version), 0) + 1 into new.version
  from public.creative_copy_versions copy where copy.task_id = new.task_id;
  new.created_by := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

create trigger creative_copy_number_version before insert on public.creative_copy_versions
for each row execute function public.number_creative_copy_version();

commit;
