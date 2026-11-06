begin;

-- Keep existing records and IDs, including units with a different code but the same name.
insert into public.business_units (code, name, short_name, sector)
select seed.code, seed.name, seed.name, seed.sector
from (values ('GG_SUPPLY', 'GG Supply', 'garment'), ('GUDSKUY', 'Gudskuy', 'garment'),
             ('BAKSO_UJO', 'Bakso Ujo', 'fnb')) as seed(code, name, sector)
where not exists (
  select 1 from public.business_units unit
  where regexp_replace(lower(unit.code), '[^a-z0-9]', '', 'g') = regexp_replace(lower(seed.code), '[^a-z0-9]', '', 'g')
     or regexp_replace(lower(unit.name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(seed.name), '[^a-z0-9]', '', 'g')
)
on conflict (code) do nothing;

-- The existing workspace owner explicitly creates the organization and becomes its first owner.
create function public.create_workspace_organization(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  organization uuid;
  caller uuid := auth.uid();
begin
  if not public.is_active_user() or not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = caller and r.code = 'owner'
  ) then
    raise exception 'Hanya owner workspace yang dapat membuat organisasi.' using errcode = '42501';
  end if;
  insert into public.organizations (name) values (btrim(p_name)) returning id into organization;
  insert into public.organization_memberships (organization_id, user_id, role)
  values (organization, caller, 'owner');
  return organization;
end;
$$;

create function public.link_workspace_business_unit(p_organization uuid, p_unit uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_user() or not exists (
    select 1 from public.organization_memberships
    where organization_id = p_organization and user_id = auth.uid() and role = 'owner'
  ) or not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.code = 'owner'
  ) then
    raise exception 'Hanya owner workspace dan organisasi yang dapat menghubungkan unit.' using errcode = '42501';
  end if;
  update public.business_units set organization_id = p_organization
  where id = p_unit and (organization_id is null or organization_id = p_organization);
  if not found then
    raise exception 'Unit tidak ditemukan atau sudah terhubung ke organisasi lain.';
  end if;
end;
$$;

-- Set a unit role, or pass NULL to remove it. Organization ownership is managed separately.
create function public.set_workspace_unit_membership(p_unit uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  organization uuid;
begin
  select organization_id into organization from public.business_units where id = p_unit for share;
  if organization is null or not public.is_active_user() or not exists (
    select 1 from public.organization_memberships
    where organization_id = organization and user_id = auth.uid() and role in ('owner', 'admin')
  ) or not public.has_permission('launch.admin') then
    raise exception 'Anda tidak dapat mengelola anggota unit ini.' using errcode = '42501';
  end if;
  if p_role is null then
    delete from public.business_unit_memberships where business_unit_id = p_unit and user_id = p_user;
    return;
  end if;
  if p_role not in ('manager', 'contributor', 'viewer') or not exists (
    select 1 from public.profiles where id = p_user and is_active
  ) then
    raise exception 'Pilih profil aktif dan peran unit yang valid.';
  end if;
  insert into public.organization_memberships (organization_id, user_id, role)
  values (organization, p_user, 'member') on conflict do nothing;
  insert into public.business_unit_memberships (organization_id, business_unit_id, user_id, role)
  values (organization, p_unit, p_user, p_role)
  on conflict (business_unit_id, user_id) do update set role = excluded.role;
end;
$$;

create policy business_unit_memberships_read_admin on public.business_unit_memberships
  for select to authenticated using (
    (select public.has_permission('launch.admin')) and exists (
      select 1 from public.organization_memberships m
      where m.organization_id = business_unit_memberships.organization_id
        and m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')
    )
  );

revoke all on function public.create_workspace_organization(text),
  public.link_workspace_business_unit(uuid, uuid), public.set_workspace_unit_membership(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_workspace_organization(text),
  public.link_workspace_business_unit(uuid, uuid), public.set_workspace_unit_membership(uuid, uuid, text)
  to authenticated;

commit;
