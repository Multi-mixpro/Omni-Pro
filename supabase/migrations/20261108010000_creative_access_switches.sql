begin;

create table public.creative_access_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null check (code in ('creative.view','creative.edit','creative.tasks.remove')),
  allowed boolean not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id,code)
);
alter table public.creative_access_overrides enable row level security;
revoke all on public.creative_access_overrides from public, anon, authenticated;

create function public.workspace_role_has(p_user uuid, p_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id=ur.role_id
    join public.permissions p on p.id=rp.permission_id
    where ur.user_id=p_user and p.code=p_code
  );
$$;
revoke all on function public.workspace_role_has(uuid,text) from public, anon, authenticated;

create function public.creative_access_for_user(p_user uuid)
returns table(code text, role_allowed boolean, override_allowed boolean, allowed boolean)
language sql stable security definer set search_path = '' as $$
  with profile as (
    select is_active as active, public.workspace_role_has(p_user,'launch.admin') as admin
    from public.profiles where id=p_user
  ), roles as (
    select permission.code, profile.active, profile.admin,
      profile.admin or public.workspace_role_has(p_user,permission.code) as inherited,
      custom.allowed as override_value
    from profile cross join (values ('creative.view'),('creative.edit'),('creative.tasks.remove')) as permission(code)
    left join public.creative_access_overrides custom on custom.user_id=p_user and custom.code=permission.code
  ), choices as (
    select code, active, inherited, override_value,
      admin or coalesce(override_value,inherited) as requested
    from roles
  )
  select code, inherited, override_value, active and requested
    and (code='creative.view' or exists (select 1 from choices c where c.code='creative.view' and c.requested))
    and (code<>'creative.tasks.remove' or exists (select 1 from choices c where c.code='creative.edit' and c.requested))
  from choices;
$$;
revoke all on function public.creative_access_for_user(uuid) from public, anon, authenticated;

create or replace function public.has_permission(permission_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case when permission_code in ('creative.view','creative.edit','creative.tasks.remove') then
    coalesce((select access.allowed from public.creative_access_for_user(auth.uid()) access where access.code=permission_code),false)
  else exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id=ur.role_id
    join public.permissions p on p.id=rp.permission_id
    where ur.user_id=auth.uid() and p.code=permission_code
  ) end;
$$;

create or replace function public.my_permissions()
returns table(code text) language sql stable security definer set search_path = '' as $$
  select p.code from public.user_roles ur
  join public.role_permissions rp on rp.role_id=ur.role_id
  join public.permissions p on p.id=rp.permission_id
  where ur.user_id=auth.uid() and p.code not in ('creative.view','creative.edit','creative.tasks.remove')
  union
  select access.code from public.creative_access_for_user(auth.uid()) access where access.allowed;
$$;

create function public.get_creative_user_access(p_user uuid)
returns table(code text, role_allowed boolean, override_allowed boolean, allowed boolean, protected_admin boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_active_user() and public.has_permission('launch.admin')) then
    raise exception 'Hanya admin aktif yang dapat membuka izin akun.' using errcode='42501';
  end if;
  return query select access.*, public.workspace_role_has(p_user,'launch.admin')
  from public.creative_access_for_user(p_user) access;
end;
$$;

create function public.set_creative_user_access(p_user uuid, p_code text, p_allowed boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_active_user() and public.has_permission('launch.admin')) then
    raise exception 'Hanya admin aktif yang dapat mengubah izin akun.' using errcode='42501';
  end if;
  if p_code is null or p_code not in ('creative.view','creative.edit','creative.tasks.remove') then
    raise exception 'Pilihan izin Creative tidak dikenal.' using errcode='22023';
  end if;
  perform 1 from public.profiles where id=p_user and is_active for update;
  if not found then raise exception 'Akun tidak ditemukan atau sudah nonaktif.'; end if;
  if p_user=auth.uid() or public.workspace_role_has(p_user,'launch.admin') then
    raise exception 'Izin akun admin mengikuti role administrator.' using errcode='42501';
  end if;

  if p_allowed is null then
    delete from public.creative_access_overrides where user_id=p_user and code=p_code;
  else
    insert into public.creative_access_overrides(user_id,code,allowed,updated_by)
    values(p_user,p_code,p_allowed,auth.uid())
    on conflict (user_id,code) do update set
      allowed=excluded.allowed,updated_by=excluded.updated_by,updated_at=now();
  end if;
end;
$$;
revoke all on function public.get_creative_user_access(uuid), public.set_creative_user_access(uuid,text,boolean) from public, anon;
grant execute on function public.get_creative_user_access(uuid), public.set_creative_user_access(uuid,text,boolean) to authenticated;

create function public.creative_team_directory()
returns table(id uuid, full_name text, is_active boolean, job_title text, can_decide boolean)
language sql stable security definer set search_path = '' as $$
  select p.id,p.full_name,p.is_active,p.job_title,
    coalesce((select access.allowed from public.creative_access_for_user(p.id) access where access.code='creative.edit'),false)
  from public.profiles p
  where (select public.is_active_user())
    and ((select public.has_permission('creative.view')) or (select public.has_permission('launch.admin')))
  order by p.full_name,p.id;
$$;
revoke all on function public.creative_team_directory() from public, anon;
grant execute on function public.creative_team_directory() to authenticated;

create or replace function public.guard_creative_decision_member_access()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  previous_reviewer uuid;
  previous_approver uuid;
  member_id uuid;
begin
  if tg_op = 'UPDATE' then
    previous_reviewer := old.reviewer_id;
    previous_approver := old.approver_id;
  end if;
  for member_id in
    select distinct candidate.id
    from (values (new.reviewer_id, previous_reviewer), (new.approver_id, previous_approver)) candidate(id, previous_id)
    where candidate.id is not null and candidate.id is distinct from candidate.previous_id
  loop
    if not exists (
      select 1 from public.creative_access_for_user(member_id) access
      where access.code='creative.edit' and access.allowed
    ) then
      raise exception 'Reviewer dan pemberi persetujuan harus memiliki akses edit Creative.' using errcode='42501';
    end if;
  end loop;
  return new;
end;
$$;

commit;
