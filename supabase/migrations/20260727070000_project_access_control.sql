-- Per-article access control: which team members are assigned to an article and
-- which of them may push it through the production-release gate.

begin;

alter table public.launch_project_members
  add column if not exists can_launch boolean not null default false;

comment on column public.launch_project_members.can_launch is
  'Anggota boleh menjalankan gate rilis/produksi artikel ini, selain permission global.';

-- Owner/admin keeps blanket authority; everyone else must be an assigned member
-- with can_launch on this specific article.
create or replace function public.can_launch_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_permission('launch.admin')
      or exists (
        select 1 from public.launch_project_members m
        where m.project_id = p_project_id
          and m.user_id = auth.uid()
          and m.can_launch
      );
$$;

grant execute on function public.can_launch_project(uuid) to authenticated;

create or replace function public.transition_launch_stage(p_stage_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_stage public.launch_stage_runs%rowtype;
begin
  if not public.has_permission('launch.edit') then raise exception 'Akses perubahan tahap ditolak'; end if;
  if p_status not in ('NOT_STARTED','IN_PROGRESS','WAITING','BLOCKED','IN_REVIEW','REVISION','COMPLETED') then raise exception 'Status tahap tidak valid'; end if;
  select * into v_stage from public.launch_stage_runs where id = p_stage_id for update;
  if not found then raise exception 'Tahap tidak ditemukan'; end if;

  -- Release-critical stages are restricted to members trusted with this article.
  if p_status = 'COMPLETED'
     and v_stage.code in ('OWNER_APPROVAL','PRODUCTION_READY')
     and not public.can_launch_project(v_stage.project_id) then
    raise exception 'Anda tidak memiliki akses merilis artikel ini';
  end if;

  if p_status = 'COMPLETED' and not public.validate_launch_gate(v_stage.project_id, v_stage.code) then raise exception 'Gate wajib tahap ini belum lengkap'; end if;

  update public.launch_stage_runs
  set status = p_status,
      progress = case when p_status = 'COMPLETED' then 100 when p_status = 'NOT_STARTED' then 0 else greatest(progress,10) end,
      started_at = case when p_status = 'IN_PROGRESS' then coalesce(started_at,now()) else started_at end,
      completed_at = case when p_status = 'COMPLETED' then now() else null end
  where id = p_stage_id;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values(v_stage.project_id, auth.uid(), 'STAGE_CHANGED', 'mengubah tahap ' || v_stage.name || ' menjadi ' || p_status, jsonb_build_object('stage',v_stage.code,'status',p_status));

  perform public.recalculate_launch_progress(v_stage.project_id);
end;
$$;

grant execute on function public.transition_launch_stage(uuid,text) to authenticated;

-- Existing owners keep the ability to release the articles they already own.
update public.launch_project_members m
set can_launch = true
from public.launch_projects p
where m.project_id = p.id and m.user_id = p.owner_id;

commit;
