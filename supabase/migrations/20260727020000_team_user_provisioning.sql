-- Secure provisioning for GG Indo Apparel team accounts.
-- Prepare an invite claim before creating the Supabase Auth user so the
-- profile and role are assigned automatically without trusting user metadata.

begin;

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  username text check (username is null or username ~ '^[a-z0-9._-]{3,40}$'),
  role_code text not null references public.roles(code) on update cascade,
  job_title text,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  user_id uuid unique references public.profiles(id) on delete set null
);

create unique index team_invites_email_lower_idx on public.team_invites (lower(trim(email)));

alter table public.team_invites enable row level security;

create policy team_invites_admin_read
on public.team_invites for select to authenticated
using (public.has_permission('launch.admin'));

create policy team_invites_admin_insert
on public.team_invites for insert to authenticated
with check (public.has_permission('launch.admin'));

create policy team_invites_admin_update
on public.team_invites for update to authenticated
using (public.has_permission('launch.admin'))
with check (public.has_permission('launch.admin'));

create policy team_invites_admin_delete
on public.team_invites for delete to authenticated
using (public.has_permission('launch.admin'));

grant select, insert, update, delete on public.team_invites to authenticated;

create or replace function public.provision_auth_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth auth.users%rowtype;
  v_invite public.team_invites%rowtype;
  v_has_invite boolean := false;
  v_base_username text;
  v_username text;
  v_full_name text;
  v_job_title text;
  v_role_code text;
  v_role_id uuid;
begin
  select * into v_auth
  from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Auth user % tidak ditemukan', p_user_id;
  end if;

  select * into v_invite
  from public.team_invites
  where lower(trim(email)) = lower(trim(v_auth.email))
    and user_id is null
  order by created_at desc
  limit 1;
  v_has_invite := found;

  v_full_name := coalesce(
    case when v_has_invite then nullif(trim(v_invite.full_name), '') end,
    nullif(trim(v_auth.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(v_auth.raw_user_meta_data->>'name'), ''),
    nullif(initcap(replace(replace(split_part(coalesce(v_auth.email, ''), '@', 1), '.', ' '), '_', ' ')), ''),
    'Anggota Tim'
  );

  v_job_title := coalesce(
    case when v_has_invite then nullif(trim(v_invite.job_title), '') end,
    nullif(trim(v_auth.raw_user_meta_data->>'job_title'), '')
  );

  v_base_username := lower(regexp_replace(
    coalesce(
      case when v_has_invite then nullif(trim(v_invite.username), '') end,
      nullif(trim(v_auth.raw_user_meta_data->>'username'), ''),
      nullif(split_part(coalesce(v_auth.email, ''), '@', 1), ''),
      'anggota-' || left(replace(v_auth.id::text, '-', ''), 8)
    ),
    '[^a-zA-Z0-9._-]',
    '',
    'g'
  ));
  v_base_username := regexp_replace(v_base_username, '^[-._]+|[-._]+$', '', 'g');

  if length(v_base_username) < 3 then
    v_base_username := 'user-' || left(replace(v_auth.id::text, '-', ''), 8);
  end if;

  v_base_username := left(v_base_username, 40);
  v_username := v_base_username;

  if exists (
    select 1 from public.profiles
    where username = v_username and id <> v_auth.id
  ) then
    v_username := left(v_base_username, 31) || '-' || left(replace(v_auth.id::text, '-', ''), 8);
  end if;

  if v_has_invite then
    v_role_code := v_invite.role_code;
  else
    select code into v_role_code
    from public.roles
    where code = lower(nullif(trim(v_auth.raw_app_meta_data->>'app_role'), ''))
    limit 1;
  end if;
  v_role_code := coalesce(v_role_code, 'product_team');

  insert into public.profiles(id, username, full_name, job_title, avatar_url, is_active)
  values (
    v_auth.id,
    v_username,
    v_full_name,
    v_job_title,
    nullif(v_auth.raw_user_meta_data->>'avatar_url', ''),
    true
  )
  on conflict (id) do nothing;

  if not exists (select 1 from public.user_roles where user_id = v_auth.id) then
    select id into v_role_id from public.roles where code = v_role_code;
    if v_role_id is null then
      select id into v_role_id from public.roles where code = 'product_team';
    end if;
    insert into public.user_roles(user_id, role_id)
    values (v_auth.id, v_role_id)
    on conflict do nothing;
  end if;

  if v_has_invite then
    update public.team_invites
    set user_id = v_auth.id,
        claimed_at = coalesce(claimed_at, now())
    where id = v_invite.id;
  end if;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.provision_auth_user(new.id);
  return new;
end;
$$;

revoke all on function public.provision_auth_user(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_product_launch on auth.users;
create trigger on_auth_user_created_product_launch
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Repair only incomplete historical users. Existing profiles and role choices
-- remain untouched.
do $$
declare
  v_user record;
begin
  for v_user in
    select u.id
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
  loop
    perform public.provision_auth_user(v_user.id);
  end loop;
end;
$$;

insert into public.user_roles(user_id, role_id)
select p.id, r.id
from public.profiles p
cross join public.roles r
where r.code = 'product_team'
  and not exists (select 1 from public.user_roles ur where ur.user_id = p.id)
on conflict do nothing;

comment on table public.team_invites is 'Owner-managed allowlist that securely maps invited team emails to Product Launch OS roles.';
comment on function public.provision_auth_user(uuid) is 'Creates the shared profile and initial role for a Supabase Auth user.';

commit;
