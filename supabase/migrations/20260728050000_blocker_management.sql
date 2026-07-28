-- Blueprint bagian 8.5 (Blocker Management): saat ini kolom blocking_note ada
-- di launch_stage_runs tetapi tidak ada tempat penyimpanan terstruktur dan
-- tidak ada jalur UI untuk mengisinya. Tabel ini menyimpan jenis blocker,
-- penanggung jawab, target penyelesaian, dampak, dan riwayat resolusi.

begin;

create table if not exists public.launch_blockers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  stage_run_id uuid references public.launch_stage_runs(id) on delete cascade,
  blocker_type text not null check (blocker_type in ('MATERIAL','SUPPLIER','SAMPLE','APPROVAL','INTERNAL','BUDGET','OTHER')),
  description text not null,
  owner_id uuid references public.profiles(id),
  target_resolution_date date,
  impact text,
  affects_target boolean not null default false,
  status text not null default 'OPEN' check (status in ('OPEN','RESOLVED')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launch_blockers_project_idx on public.launch_blockers(project_id);
create index if not exists launch_blockers_open_idx on public.launch_blockers(project_id) where status = 'OPEN';

alter table public.launch_blockers enable row level security;

create policy launch_blockers_read on public.launch_blockers
  for select using (has_permission('launch.view'));

create policy launch_blockers_insert on public.launch_blockers
  for insert with check (has_permission('launch.edit') or has_permission('launch.create'));

create policy launch_blockers_update on public.launch_blockers
  for update using (has_permission('launch.edit')) with check (has_permission('launch.edit'));

create policy launch_blockers_delete on public.launch_blockers
  for delete using (has_permission('launch.admin'));

drop trigger if exists set_updated_at on public.launch_blockers;
create trigger set_updated_at before update on public.launch_blockers
  for each row execute function public.set_updated_at();

-- Menandai tahap terhambat: catat blocker terstruktur, sinkronkan ringkasan ke
-- blocking_note (dipakai kartu "tindakan berikutnya"), lalu ubah status tahap.
create or replace function public.report_stage_blocker(
  p_stage_id uuid, p_blocker_type text, p_description text,
  p_target_resolution_date date, p_impact text, p_affects_target boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_stage public.launch_stage_runs%rowtype;
  v_blocker_id uuid;
begin
  if not has_permission('launch.edit') then raise exception 'Akses menandai hambatan ditolak'; end if;
  select * into v_stage from public.launch_stage_runs where id = p_stage_id for update;
  if not found then raise exception 'Tahap tidak ditemukan'; end if;

  insert into public.launch_blockers(project_id, stage_run_id, blocker_type, description, owner_id, target_resolution_date, impact, affects_target, created_by)
  values (v_stage.project_id, p_stage_id, p_blocker_type, p_description, auth.uid(), p_target_resolution_date, p_impact, p_affects_target, auth.uid())
  returning id into v_blocker_id;

  update public.launch_stage_runs
  set status = 'BLOCKED', blocking_note = p_description
  where id = p_stage_id;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (v_stage.project_id, auth.uid(), 'STAGE_BLOCKED', 'menandai ' || v_stage.name || ' terhambat: ' || p_description, jsonb_build_object('stage', v_stage.code, 'blocker_id', v_blocker_id, 'affects_target', p_affects_target));

  return v_blocker_id;
end;
$$;

grant execute on function public.report_stage_blocker(uuid,text,text,date,text,boolean) to authenticated;

-- Menyelesaikan blocker: catat resolusi, kembalikan tahap ke IN_PROGRESS.
create or replace function public.resolve_stage_blocker(p_blocker_id uuid, p_resolution_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_blocker public.launch_blockers%rowtype;
  v_stage_name text;
begin
  if not has_permission('launch.edit') then raise exception 'Akses menyelesaikan hambatan ditolak'; end if;
  select * into v_blocker from public.launch_blockers where id = p_blocker_id for update;
  if not found then raise exception 'Data hambatan tidak ditemukan'; end if;

  update public.launch_blockers
  set status = 'RESOLVED', resolution_note = p_resolution_note, resolved_at = now(), resolved_by = auth.uid()
  where id = p_blocker_id;

  if v_blocker.stage_run_id is not null then
    update public.launch_stage_runs
    set status = 'IN_PROGRESS', blocking_note = null
    where id = v_blocker.stage_run_id and status = 'BLOCKED'
    returning name into v_stage_name;
  end if;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (v_blocker.project_id, auth.uid(), 'BLOCKER_RESOLVED', 'menyelesaikan hambatan' || coalesce(': ' || v_stage_name, '') || ' — ' || p_resolution_note, jsonb_build_object('blocker_id', p_blocker_id));
end;
$$;

grant execute on function public.resolve_stage_blocker(uuid,text) to authenticated;

comment on table public.launch_blockers is 'Blocker terstruktur per tahap (Blueprint bagian 8.5): jenis, penanggung jawab, target penyelesaian, dampak, dan riwayat resolusi.';

commit;
