-- report_stage_blocker/resolve_stage_blocker mengubah status tahap tetapi
-- lupa memanggil recalculate_launch_progress, sehingga status artikel
-- (launch_projects.status) tidak ikut berubah menjadi/keluar dari 'BLOCKED'.
-- Ini menyebabkan KPI "Terhambat" di dashboard tidak akurat.

begin;

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

  perform public.recalculate_launch_progress(v_stage.project_id);

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (v_stage.project_id, auth.uid(), 'STAGE_BLOCKED', 'menandai ' || v_stage.name || ' terhambat: ' || p_description, jsonb_build_object('stage', v_stage.code, 'blocker_id', v_blocker_id, 'affects_target', p_affects_target));

  return v_blocker_id;
end;
$$;

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

    perform public.recalculate_launch_progress(v_blocker.project_id);
  end if;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (v_blocker.project_id, auth.uid(), 'BLOCKER_RESOLVED', 'menyelesaikan hambatan' || coalesce(': ' || v_stage_name, '') || ' — ' || p_resolution_note, jsonb_build_object('blocker_id', p_blocker_id));
end;
$$;

commit;
