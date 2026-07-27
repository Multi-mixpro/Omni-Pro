-- Research workstream: overall conclusion field and an updated RESEARCH gate
-- that matches the blueprint (documented reference + research conclusion).

begin;

alter table public.launch_projects
  add column if not exists research_summary text;

create or replace function public.validate_launch_gate(p_project_id uuid, p_stage_code text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return case p_stage_code
    when 'BRIEF' then exists(select 1 from public.launch_projects where id = p_project_id and concept is not null)
    when 'RESEARCH' then exists(select 1 from public.launch_references where project_id = p_project_id)
      and exists(select 1 from public.launch_projects where id = p_project_id and nullif(trim(research_summary),'') is not null)
    when 'SOURCING' then exists(select 1 from public.launch_supplier_quotes where project_id = p_project_id and status = 'SELECTED')
    when 'SAMPLING' then exists(select 1 from public.launch_samples where project_id = p_project_id and is_master and status = 'APPROVED')
    when 'COSTING' then exists(select 1 from public.launch_hpp_versions where project_id = p_project_id and status = 'FINAL')
    when 'SPECIFICATION' then exists(select 1 from public.launch_colorways where project_id = p_project_id and status = 'APPROVED') and exists(select 1 from public.launch_size_charts where project_id = p_project_id and status = 'FINAL')
    when 'QC' then exists(select 1 from public.launch_qc_checks where project_id = p_project_id and result = 'PASS')
    when 'OWNER_APPROVAL' then exists(select 1 from public.launch_approvals where project_id = p_project_id and approval_type = 'PRODUCTION' and status = 'APPROVED')
    when 'PRODUCTION_READY' then not exists(select 1 from public.launch_stage_runs where project_id = p_project_id and code <> 'PRODUCTION_READY' and status <> 'COMPLETED')
    else false end;
end;
$$;

comment on column public.launch_projects.research_summary is 'Kesimpulan riset: insight utama, target pengguna, dan risiko sebelum lanjut ke sourcing.';

commit;
