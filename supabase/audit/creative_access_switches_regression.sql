-- Verify effective permissions without changing any real account after rollback.
begin;

do $fixture$
declare
  administrator uuid;
  member uuid;
begin
  select id into administrator from public.profiles
  where is_active and public.workspace_role_has(id,'launch.admin') order by id limit 1;
  select id into member from public.profiles
  where is_active and not public.workspace_role_has(id,'launch.admin') order by id limit 1;
  if administrator is null or member is null then
    raise exception 'Audit requires an active admin and a non-admin account.';
  end if;
  perform set_config('audit.admin',administrator::text,true);
  perform set_config('audit.member',member::text,true);
  perform set_config('request.jwt.claim.sub',administrator::text,true);
end;
$fixture$;

set local role authenticated;

do $verify$
declare
  administrator uuid := current_setting('audit.admin')::uuid;
  member uuid := current_setting('audit.member')::uuid;
  own_access boolean;
begin
  begin
    perform public.set_creative_user_access(administrator,'creative.view',false);
    raise exception 'Audit failed: own admin permissions could be changed.';
  exception when insufficient_privilege then null;
  end;
  perform public.set_creative_user_access(member,'creative.view',true);
  perform public.set_creative_user_access(member,'creative.edit',true);
  perform public.set_creative_user_access(member,'creative.tasks.remove',true);
  perform set_config('request.jwt.claim.sub',member::text,true);
  if not public.has_permission('creative.tasks.remove') or not exists (
    select 1 from public.my_permissions() where code='creative.tasks.remove'
  ) then
    raise exception 'Audit failed: frontend and database grants disagree.';
  end if;
  if not exists (select 1 from public.creative_team_directory() where id=member and can_decide) then
    raise exception 'Audit failed: reviewer eligibility does not include effective overrides.';
  end if;
  begin
    perform public.set_creative_user_access(member,'creative.edit',false);
    raise exception 'Audit failed: non-admin could update permissions.';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub',administrator::text,true);
  perform public.set_creative_user_access(member,'creative.edit',false);
  perform set_config('request.jwt.claim.sub',member::text,true);
  if not public.has_permission('creative.view')
    or public.has_permission('creative.edit') or public.has_permission('creative.tasks.remove') then
    raise exception 'Audit failed: edit off did not disable dependent removal.';
  end if;
  begin
    insert into public.creative_tasks(title) values ('[AUDIT ROLLBACK] denied task');
    raise exception 'Audit failed: RLS allowed insert with edit off.';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub',administrator::text,true);
  perform public.set_creative_user_access(member,'creative.view',false);
  perform public.set_creative_user_access(member,'creative.edit',true);
  perform set_config('request.jwt.claim.sub',member::text,true);
  if exists (select 1 from public.creative_tasks)
    or exists (select 1 from public.my_permissions() where code like 'creative.%') then
    raise exception 'Audit failed: view off left Creative access active.';
  end if;

  perform set_config('request.jwt.claim.sub',administrator::text,true);
  perform public.set_creative_user_access(member,'creative.view',null);
  select allowed = role_allowed and override_allowed is null into strict own_access
  from public.get_creative_user_access(member) where code='creative.view';
  if not own_access then raise exception 'Audit failed: reset did not restore role default.'; end if;
end;
$verify$;

reset role;
select 'Creative access switches, dependencies, reviewer eligibility, and RLS checks passed.' as result;
rollback;
