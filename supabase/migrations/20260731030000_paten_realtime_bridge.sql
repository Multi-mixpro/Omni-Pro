-- PATEN compatibility and realtime persistence bridge.
--
-- The existing Product Launch schema remains the operational source for
-- authentication, permissions, legacy projects, media, and normalized
-- workflows. PATEN records preserve the richer Product Launch OS 3.0 shape
-- without flattening it into lossy legacy columns.

begin;

create table if not exists public.paten_records (
  record_type text not null check (
    record_type in (
      'article',
      'supplier',
      'material',
      'service',
      'task',
      'blocker',
      'decision',
      'approval',
      'progress_update'
    )
  ),
  record_id text not null,
  project_id uuid references public.launch_projects(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  revision bigint not null default 1,
  created_by uuid references public.profiles(id) default auth.uid(),
  updated_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (record_type, record_id)
);

create index if not exists paten_records_project_idx
  on public.paten_records(project_id)
  where project_id is not null;

create index if not exists paten_records_active_type_idx
  on public.paten_records(record_type, updated_at desc)
  where not is_deleted;

alter table public.paten_records enable row level security;

drop policy if exists paten_records_read on public.paten_records;
create policy paten_records_read on public.paten_records
  for select to authenticated
  using (public.has_permission('launch.view') or public.has_permission('launch.admin'));

drop policy if exists paten_records_insert on public.paten_records;
create policy paten_records_insert on public.paten_records
  for insert to authenticated
  with check (
    public.has_permission('launch.edit')
    or public.has_permission('launch.create')
    or public.has_permission('launch.admin')
  );

drop policy if exists paten_records_update on public.paten_records;
create policy paten_records_update on public.paten_records
  for update to authenticated
  using (
    public.has_permission('launch.edit')
    or public.has_permission('launch.admin')
  )
  with check (
    public.has_permission('launch.edit')
    or public.has_permission('launch.admin')
  );

drop policy if exists paten_records_delete on public.paten_records;
create policy paten_records_delete on public.paten_records
  for delete to authenticated
  using (public.has_permission('launch.admin'));

create or replace function public.touch_paten_record()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.payload is distinct from old.payload
     or new.is_deleted is distinct from old.is_deleted then
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists touch_paten_record on public.paten_records;
create trigger touch_paten_record
before update on public.paten_records
for each row execute function public.touch_paten_record();

-- Publish both the bridge and the legacy tables consumed by the adapter.
-- The guarded block is safe when a table is already part of the publication.
do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'paten_records',
      'launch_projects',
      'launch_tasks',
      'launch_blockers',
      'launch_comments',
      'launch_approvals',
      'launch_progress_updates',
      'launch_references',
      'media_assets',
      'suppliers',
      'materials',
      'cost_components'
    ]
    loop
      if to_regclass(format('public.%I', table_name)) is not null
         and not exists (
           select 1
           from pg_publication_tables
           where pubname = 'supabase_realtime'
             and schemaname = 'public'
             and tablename = table_name
         ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          table_name
        );
      end if;
    end loop;
  end if;
end;
$$;

commit;
