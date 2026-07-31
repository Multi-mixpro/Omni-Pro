-- Two-sided progress sheet for owner, project lead, and execution team.

begin;

create table if not exists public.launch_progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  stage_code text check (stage_code is null or stage_code in ('BRIEF','RESEARCH','SOURCING','SAMPLING','COSTING','SPECIFICATION','QC','OWNER_APPROVAL','PRODUCTION_READY')),
  author_id uuid not null references public.profiles(id),
  update_type text not null default 'TEAM_UPDATE' check (update_type in ('TEAM_UPDATE','OWNER_DIRECTION','MILESTONE','RISK')),
  completed_text text,
  current_text text,
  blocker_text text,
  decision_needed text,
  next_step text,
  forecast_finish date,
  progress_percent integer check (progress_percent is null or progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  check (
    nullif(trim(coalesce(completed_text, '')), '') is not null
    or nullif(trim(coalesce(current_text, '')), '') is not null
    or nullif(trim(coalesce(blocker_text, '')), '') is not null
    or nullif(trim(coalesce(decision_needed, '')), '') is not null
    or nullif(trim(coalesce(next_step, '')), '') is not null
  )
);

create index if not exists launch_progress_updates_project_created_idx
  on public.launch_progress_updates(project_id, created_at desc);
create index if not exists launch_progress_updates_forecast_idx
  on public.launch_progress_updates(forecast_finish)
  where forecast_finish is not null;

alter table public.launch_progress_updates enable row level security;

create policy launch_progress_updates_read
  on public.launch_progress_updates for select to authenticated
  using (public.has_permission('launch.view'));
create policy launch_progress_updates_insert
  on public.launch_progress_updates for insert to authenticated
  with check (
    author_id = auth.uid()
    and (public.has_permission('launch.edit') or public.has_permission('launch.create'))
  );
create policy launch_progress_updates_delete
  on public.launch_progress_updates for delete to authenticated
  using (public.has_permission('launch.admin') or author_id = auth.uid());

commit;
