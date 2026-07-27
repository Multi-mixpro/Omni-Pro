-- Adds milestone planning around the atomic launch brief builder and separates
-- supplier purchase units from material-consumption units.

begin;

alter table public.launch_projects
  add column if not exists target_fix_date date,
  add column if not exists target_launch_date date;

create or replace function public.create_launch_project_brief(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_ready_date date;
  v_fix_date date;
  v_launch_date date;
  v_item jsonb;
begin
  -- The core function creates the project and every structured draft record in
  -- the same transaction. Any failure below rolls the entire command back.
  v_project_id := public.create_launch_project(p_payload);
  v_ready_date := nullif(p_payload->>'target_date','')::date;
  v_fix_date := nullif(p_payload->>'target_fix_date','')::date;
  v_launch_date := nullif(p_payload->>'target_launch_date','')::date;

  update public.launch_projects
  set target_fix_date = v_fix_date,
      target_launch_date = v_launch_date
  where id = v_project_id;

  update public.launch_stage_runs
  set due_date = case code
    when 'BRIEF' then current_date
    when 'RESEARCH' then coalesce(nullif(p_payload->>'target_research_date','')::date, current_date + 3)
    when 'SOURCING' then coalesce(nullif(p_payload->>'target_sourcing_date','')::date, current_date + 7)
    when 'SAMPLING' then coalesce(v_fix_date, current_date + 14)
    when 'COSTING' then coalesce(nullif(p_payload->>'target_costing_date','')::date, v_fix_date, current_date + 17)
    when 'SPECIFICATION' then coalesce(v_fix_date, current_date + 20)
    when 'QC' then coalesce(v_ready_date - 2, current_date + 24)
    when 'OWNER_APPROVAL' then coalesce(v_ready_date - 1, current_date + 25)
    when 'PRODUCTION_READY' then coalesce(v_ready_date, current_date + 26)
    else due_date
  end
  where project_id = v_project_id;

  update public.launch_tasks t
  set due_date = s.due_date
  from public.launch_stage_runs s
  where t.project_id = v_project_id
    and s.project_id = t.project_id
    and s.code = t.stage_code;

  -- The inner brief function preserves consumption units on material
  -- candidates. Purchase/quotation units are corrected independently here.
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'materials','[]'::jsonb))
  loop
    if nullif(trim(coalesce(v_item->>'proposed_name','')),'') is not null then
      update public.launch_supplier_quotes q
      set unit = coalesce(nullif(trim(v_item->>'price_unit'),''), q.unit)
      from public.launch_material_candidates m
      where q.project_id = v_project_id
        and m.id = q.material_candidate_id
        and m.project_id = v_project_id
        and lower(trim(m.proposed_name)) = lower(trim(v_item->>'proposed_name'));
    end if;
  end loop;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (
    v_project_id,
    auth.uid(),
    'MILESTONES_PLANNED',
    'menetapkan target riset, sourcing, artikel fix, HPP, siap produksi, dan rilis.',
    jsonb_build_object(
      'research', nullif(p_payload->>'target_research_date',''),
      'sourcing', nullif(p_payload->>'target_sourcing_date',''),
      'article_fix', nullif(p_payload->>'target_fix_date',''),
      'costing', nullif(p_payload->>'target_costing_date',''),
      'production_ready', nullif(p_payload->>'target_date',''),
      'launch', nullif(p_payload->>'target_launch_date','')
    )
  );

  return v_project_id;
end;
$$;

revoke all on function public.create_launch_project_brief(jsonb) from public, anon;
grant execute on function public.create_launch_project_brief(jsonb) to authenticated;

comment on column public.launch_projects.target_fix_date is 'Target master sample, construction, fit, and specification are locked.';
comment on column public.launch_projects.target_launch_date is 'Target product release date after production readiness.';

commit;
