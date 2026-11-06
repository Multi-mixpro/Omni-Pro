begin;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now()
);

-- Existing units are linked only after their organization has been confirmed.
alter table public.business_units
  add column organization_id uuid references public.organizations(id),
  add constraint business_units_organization_id_id_key unique (organization_id, id);

-- The existing Launch admin grant must not allow a browser to change scope.
create function public.guard_business_unit_organization()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('anon', 'authenticated') then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.organization_id is not null then
      raise exception 'Unit yang terhubung ke organisasi harus dikelola melalui jalur administrasi server.'
        using errcode = '42501';
    end if;
    return old;
  end if;

  if (tg_op = 'INSERT' and new.organization_id is not null)
    or (tg_op = 'UPDATE' and new.organization_id is distinct from old.organization_id) then
    raise exception 'Hubungan unit dengan organisasi harus dikelola melalui jalur administrasi server.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_business_unit_organization
  before insert or update of organization_id or delete on public.business_units
  for each row execute function public.guard_business_unit_organization();

revoke all on function public.guard_business_unit_organization() from public, anon, authenticated;

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_idx on public.organization_memberships (user_id);

create table public.business_unit_memberships (
  organization_id uuid not null,
  business_unit_id uuid not null,
  user_id uuid not null,
  role text not null check (role in ('manager', 'contributor', 'viewer')),
  primary key (business_unit_id, user_id),
  foreign key (organization_id, business_unit_id)
    references public.business_units (organization_id, id) on delete cascade,
  foreign key (organization_id, user_id)
    references public.organization_memberships (organization_id, user_id) on delete cascade
);

create index business_unit_memberships_org_user_idx
  on public.business_unit_memberships (organization_id, user_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.business_unit_memberships enable row level security;

revoke all on public.organizations, public.organization_memberships, public.business_unit_memberships
  from public, anon, authenticated;
grant select on public.organizations, public.organization_memberships, public.business_unit_memberships
  to authenticated;
grant select, insert, update, delete on public.organizations, public.organization_memberships,
  public.business_unit_memberships to service_role;

create policy organization_memberships_read_self on public.organization_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_user()));

create policy business_unit_memberships_read_self on public.business_unit_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_user()));

create policy organizations_read_member on public.organizations
  for select to authenticated
  using (exists (
    select 1 from public.organization_memberships as membership
    where membership.organization_id = organizations.id
      and membership.user_id = (select auth.uid())
  ));

-- Evaluate scope only. Operational policies must also check the relevant permission.
create function public.has_business_unit_scope(p_business_unit_id uuid, p_write boolean)
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1
    from public.business_units as unit
    join public.organization_memberships as organization_member
      on organization_member.organization_id = unit.organization_id
      and organization_member.user_id = (select auth.uid())
    left join public.business_unit_memberships as unit_member
      on unit_member.business_unit_id = unit.id
      and unit_member.organization_id = unit.organization_id
      and unit_member.user_id = organization_member.user_id
    where unit.id = p_business_unit_id and unit.is_active
      and p_write is not null
      and (
        organization_member.role in ('owner', 'admin')
        or unit_member.role in ('manager', 'contributor')
        or (not p_write and unit_member.role = 'viewer')
      )
  );
$$;

revoke all on function public.has_business_unit_scope(uuid, boolean) from public, anon, authenticated;
grant execute on function public.has_business_unit_scope(uuid, boolean) to authenticated;

commit;
