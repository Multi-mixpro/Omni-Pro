-- Product Launch OS v2 — destructive reset of the application-owned public schema.
-- Supabase Auth is intentionally preserved. Attendance and POS remain reserved modules.

begin;

-- Fail closed if this exact v2 schema is already present. This prevents an
-- unrecorded SQL Editor migration from being applied destructively a second time.
do $migration_guard$
begin
  if to_regclass('public.launch_projects') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'launch_projects'
         and column_name = 'project_code'
     ) then
    raise exception 'Product Launch OS v2 is already installed; repair migration history instead of re-running this reset.';
  end if;
end
$migration_guard$;

create extension if not exists pgcrypto;

-- Remove the previous application surface. `auth.*`, `storage.*`, and Supabase internals are untouched.
-- First remove any legacy public views/tables not known by the new application.
do $reset_views$
declare
  legacy_view record;
begin
  for legacy_view in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
  loop
    execute format(
      'drop %s if exists public.%I cascade',
      case legacy_view.relkind when 'm' then 'materialized view' else 'view' end,
      legacy_view.relname
    );
  end loop;
end
$reset_views$;

do $reset_tables$
declare
  legacy_table record;
begin
  for legacy_table in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'f')
  loop
    execute format('drop table if exists public.%I cascade', legacy_table.relname);
  end loop;
end
$reset_tables$;

do $reset_routines$
declare
  legacy_routine record;
begin
  for legacy_routine in
    select
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind in ('f', 'p')
  loop
    execute format(
      'drop routine if exists public.%I(%s) cascade',
      legacy_routine.proname,
      legacy_routine.identity_arguments
    );
  end loop;
end
$reset_routines$;

do $reset_sequences$
declare
  legacy_sequence record;
begin
  for legacy_sequence in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'S'
  loop
    execute format('drop sequence if exists public.%I cascade', legacy_sequence.relname);
  end loop;
end
$reset_sequences$;

drop table if exists public.launch_qc_items cascade;
drop table if exists public.launch_qc_checks cascade;
drop table if exists public.launch_size_chart_measurements cascade;
drop table if exists public.launch_size_charts cascade;
drop table if exists public.launch_hpp_lines cascade;
drop table if exists public.launch_hpp_items cascade;
drop table if exists public.launch_hpp_versions cascade;
drop table if exists public.launch_samples cascade;
drop table if exists public.launch_colorways cascade;
drop table if exists public.launch_supplier_quotes cascade;
drop table if exists public.launch_material_candidates cascade;
drop table if exists public.launch_references cascade;
drop table if exists public.launch_approvals cascade;
drop table if exists public.launch_activity cascade;
drop table if exists public.launch_stage_updates cascade;
drop table if exists public.launch_tasks cascade;
drop table if exists public.launch_stage_runs cascade;
drop table if exists public.launch_stage_definitions cascade;
drop table if exists public.launch_project_members cascade;
drop table if exists public.launch_work_order_members cascade;
drop table if exists public.launch_work_orders cascade;
drop table if exists public.launch_projects cascade;
drop table if exists public.launch_article_colors cascade;
drop table if exists public.launch_size_chart_values cascade;
drop table if exists public.launch_measurement_points cascade;
drop table if exists public.launch_size_chart_sizes cascade;
drop table if exists public.launch_size_chart_versions cascade;
drop table if exists public.launch_qc_results cascade;
drop table if exists public.launch_qc_template_items cascade;
drop table if exists public.launch_qc_templates cascade;
drop table if exists public.launch_material_candidates cascade;
drop table if exists public.launch_suppliers cascade;
drop table if exists public.launch_brands cascade;
drop table if exists public.catalog_products cascade;
drop table if exists public.workspace_simulation_states cascade;
drop table if exists public.media_files cascade;
drop table if exists public.media_assets cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.user_permission_overrides cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.feature_flags cascade;
drop table if exists public.materials cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.business_units cascade;
drop table if exists public.profiles cascade;

drop function if exists public.recalculate_work_order_progress(uuid) cascade;
drop function if exists public.transition_stage_status(uuid,text,text) cascade;
drop function if exists public.create_work_order(jsonb) cascade;
drop function if exists public.publish_work_order_to_catalog(uuid) cascade;
drop function if exists public.can_view_launch_work_order(uuid) cascade;
drop function if exists public.can_update_launch_stage(uuid) cascade;
drop function if exists public.has_permission(text) cascade;
drop function if exists public.is_owner() cascade;
drop function if exists public.is_active_user() cascade;
drop function if exists public.resolve_login_email(text) cascade;
drop function if exists public.set_updated_at() cascade;
drop sequence if exists public.launch_project_code_seq cascade;

-- Shared foundation for Product Launch, future Attendance, and future POS Seller.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
  full_name text not null,
  job_title text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.business_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('GG_SUPPLY','GUDSKUY')),
  name text not null,
  short_name text not null,
  accent_color text not null default '#f36b21',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  category text,
  contact_name text,
  phone text,
  city text,
  address text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  minimum_order_notes text,
  quality_notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  category text not null,
  composition text,
  gsm numeric(10,2),
  width_cm numeric(10,2),
  unit text not null default 'meter',
  characteristics text,
  care_notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  module text not null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create sequence public.launch_project_code_seq start 1;

create table public.launch_projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  business_unit_id uuid not null references public.business_units(id),
  owner_id uuid not null references public.profiles(id),
  article_name text not null check (char_length(article_name) between 3 and 140),
  category text not null,
  concept text,
  source_notes text,
  reference_media_id uuid,
  reference_image_url text,
  status text not null default 'ACTIVE' check (status in ('DRAFT','ACTIVE','BLOCKED','IN_REVIEW','READY_FOR_PRODUCTION','ARCHIVED')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH','URGENT')),
  current_stage text not null default 'BRIEF' check (current_stage in ('BRIEF','RESEARCH','SOURCING','SAMPLING','COSTING','SPECIFICATION','QC','OWNER_APPROVAL','PRODUCTION_READY')),
  progress integer not null default 0 check (progress between 0 and 100),
  target_date date,
  production_notes text,
  ready_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.launch_project_members (
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  responsibility text,
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.launch_stage_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  code text not null check (code in ('BRIEF','RESEARCH','SOURCING','SAMPLING','COSTING','SPECIFICATION','QC','OWNER_APPROVAL','PRODUCTION_READY')),
  name text not null,
  position integer not null check (position between 1 and 9),
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PROGRESS','WAITING','BLOCKED','IN_REVIEW','REVISION','COMPLETED')),
  progress integer not null default 0 check (progress between 0 and 100),
  owner_id uuid references public.profiles(id),
  due_date date,
  blocking_note text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (project_id, code),
  unique (project_id, position)
);

create table public.launch_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  stage_code text not null,
  title text not null,
  description text,
  status text not null default 'TODO' check (status in ('TODO','DOING','WAITING','DONE')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH','URGENT')),
  assignee_id uuid references public.profiles(id),
  due_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.launch_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  title text not null,
  reference_type text not null default 'PRODUCT' check (reference_type in ('PRODUCT','MATERIAL','PRICE','CONSTRUCTION','MARKET','OTHER')),
  source_url text,
  image_url text,
  insight text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.launch_material_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  material_id uuid references public.materials(id),
  proposed_name text not null,
  role text not null default 'MAIN',
  estimated_consumption numeric(12,4),
  unit text not null default 'meter',
  suitability_notes text,
  risk_notes text,
  status text not null default 'CANDIDATE' check (status in ('CANDIDATE','TESTING','APPROVED','REJECTED')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.launch_supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  material_candidate_id uuid references public.launch_material_candidates(id) on delete cascade,
  item_name text not null,
  price numeric(16,2) not null check (price >= 0),
  unit text not null,
  moq numeric(16,2),
  lead_time_days integer,
  valid_until date,
  notes text,
  status text not null default 'CANDIDATE' check (status in ('CANDIDATE','SELECTED','REJECTED','EXPIRED')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  selected_at timestamptz
);

create table public.launch_colorways (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  name text not null,
  color_code text,
  hex_code text,
  panel_notes text,
  status text not null default 'CANDIDATE' check (status in ('CANDIDATE','APPROVED','REJECTED')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table public.launch_samples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  version integer not null,
  sample_type text not null default 'DEVELOPMENT',
  status text not null default 'PLANNED' check (status in ('PLANNED','IN_PROGRESS','REVIEW','REVISION','APPROVED','REJECTED')),
  material_notes text,
  pattern_notes text,
  construction_notes text,
  revision_notes text,
  is_master boolean not null default false,
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (project_id, version)
);
create unique index launch_samples_one_master on public.launch_samples(project_id) where is_master;

create table public.launch_hpp_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  version integer not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','IN_REVIEW','FINAL','SUPERSEDED')),
  total_hpp numeric(16,2) not null default 0,
  target_margin_percent numeric(7,2),
  recommended_price numeric(16,2),
  notes text,
  created_by uuid not null references public.profiles(id),
  finalized_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (project_id, version)
);
create unique index launch_hpp_one_final on public.launch_hpp_versions(project_id) where status = 'FINAL';

create table public.launch_hpp_lines (
  id uuid primary key default gen_random_uuid(),
  hpp_version_id uuid not null references public.launch_hpp_versions(id) on delete cascade,
  category text not null check (category in ('MATERIAL','ACCESSORY','LABOR','PRINTING','EMBROIDERY','PACKAGING','OVERHEAD','OTHER')),
  item_name text not null,
  quantity numeric(14,4) not null default 1,
  unit text not null,
  unit_price numeric(16,2) not null default 0,
  waste_percent numeric(7,2) not null default 0,
  line_total numeric(16,2) generated always as (round(quantity * unit_price * (1 + waste_percent / 100), 2)) stored,
  supplier_quote_id uuid references public.launch_supplier_quotes(id),
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.recalculate_hpp_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_hpp_id uuid;
begin
  v_hpp_id := case when tg_op = 'DELETE' then old.hpp_version_id else new.hpp_version_id end;
  update public.launch_hpp_versions
  set total_hpp = coalesce((select sum(line_total) from public.launch_hpp_lines where hpp_version_id = v_hpp_id), 0)
  where id = v_hpp_id;
  return null;
end;
$$;

create trigger recalculate_hpp_total_after_line
after insert or update or delete on public.launch_hpp_lines
for each row execute function public.recalculate_hpp_total();

create table public.launch_size_charts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  sample_id uuid references public.launch_samples(id),
  name text not null,
  version integer not null default 1,
  unit text not null default 'cm',
  sizes text[] not null default '{}',
  status text not null default 'DRAFT' check (status in ('DRAFT','IN_REVIEW','FINAL','SUPERSEDED')),
  notes text,
  created_by uuid not null references public.profiles(id),
  finalized_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (project_id, version)
);
create unique index launch_size_chart_one_final on public.launch_size_charts(project_id) where status = 'FINAL';

create table public.launch_size_chart_measurements (
  id uuid primary key default gen_random_uuid(),
  size_chart_id uuid not null references public.launch_size_charts(id) on delete cascade,
  point_code text not null,
  point_name text not null,
  position integer not null default 1,
  tolerance_plus numeric(8,2) not null default 0,
  tolerance_minus numeric(8,2) not null default 0,
  values jsonb not null default '{}',
  unique (size_chart_id, point_code)
);

create table public.launch_qc_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  sample_id uuid references public.launch_samples(id),
  result text not null default 'PENDING' check (result in ('PENDING','PASS','FAIL','CONDITIONAL')),
  summary text,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.launch_qc_items (
  id uuid primary key default gen_random_uuid(),
  qc_check_id uuid not null references public.launch_qc_checks(id) on delete cascade,
  category text not null,
  item_name text not null,
  result text not null default 'PENDING' check (result in ('PENDING','PASS','FAIL','NA')),
  notes text,
  evidence_url text,
  position integer not null default 1
);

create table public.launch_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  approval_type text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','REVISION')),
  requested_by uuid not null references public.profiles(id),
  decided_by uuid references public.profiles(id),
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.launch_projects(id) on delete cascade,
  kind text not null default 'OTHER',
  public_id text not null unique,
  secure_url text not null,
  format text,
  width integer,
  height integer,
  bytes bigint,
  metadata jsonb not null default '{}',
  uploaded_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.launch_projects add constraint launch_projects_reference_media_fk foreign key (reference_media_id) references public.media_assets(id) on delete set null;

create table public.launch_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes optimized for mobile action feeds and project workspaces.
create index launch_projects_status_updated_idx on public.launch_projects(status, updated_at desc);
create index launch_projects_unit_status_idx on public.launch_projects(business_unit_id, status);
create index launch_stage_runs_project_position_idx on public.launch_stage_runs(project_id, position);
create index launch_tasks_assignee_status_due_idx on public.launch_tasks(assignee_id, status, due_date);
create index launch_tasks_project_idx on public.launch_tasks(project_id, created_at);
create index launch_activity_project_created_idx on public.launch_activity(project_id, created_at desc);
create index launch_quotes_project_idx on public.launch_supplier_quotes(project_id, status);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

-- Seed shared business units and permission model.
insert into public.business_units(code, name, short_name, accent_color) values
  ('GG_SUPPLY', 'GG Supply · Polosan & Custom', 'GG Supply', '#f36b21'),
  ('GUDSKUY', 'Gudskuy · Fashion Brand', 'Gudskuy', '#356e73');

insert into public.roles(code, name, description) values
  ('owner', 'Owner & Launch Director', 'Prioritas, seluruh data, dan approval akhir.'),
  ('product_lead', 'Product Research & Costing', 'Riset artikel, kelayakan produk, HPP, dan koordinasi.'),
  ('sourcing_lead', 'Sourcing & Supplier', 'Bahan, supplier, quotation, warna, dan dokumentasi.'),
  ('production_qc', 'Sampling, Production & QC', 'Sample, konstruksi, ukuran, produksi, dan quality control.'),
  ('product_team', 'Product Launch Team', 'Kolaborator lintas tahap tanpa approval owner.');

insert into public.permissions(code, module, name) values
  ('launch.view', 'launch', 'Melihat Product Launch'),
  ('launch.create', 'launch', 'Membuat perintah artikel'),
  ('launch.edit', 'launch', 'Mengubah data artikel'),
  ('launch.assign', 'launch', 'Mengatur penugasan'),
  ('launch.research.manage', 'launch', 'Mengelola riset'),
  ('launch.sourcing.manage', 'launch', 'Mengelola bahan dan supplier'),
  ('launch.sample.manage', 'launch', 'Mengelola sampling'),
  ('launch.hpp.manage', 'launch', 'Mengelola HPP'),
  ('launch.spec.manage', 'launch', 'Mengelola warna dan size chart'),
  ('launch.qc.manage', 'launch', 'Mengelola QC'),
  ('launch.media.manage', 'launch', 'Mengelola media'),
  ('launch.approve', 'launch', 'Memberikan approval akhir'),
  ('launch.admin', 'launch', 'Mengelola sistem Product Launch');

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where
  r.code = 'owner'
  or (r.code = 'product_lead' and p.code in ('launch.view','launch.create','launch.edit','launch.assign','launch.research.manage','launch.hpp.manage','launch.spec.manage','launch.media.manage'))
  or (r.code = 'sourcing_lead' and p.code in ('launch.view','launch.edit','launch.research.manage','launch.sourcing.manage','launch.spec.manage','launch.media.manage'))
  or (r.code = 'production_qc' and p.code in ('launch.view','launch.edit','launch.sample.manage','launch.spec.manage','launch.qc.manage','launch.media.manage'))
  or (r.code = 'product_team' and p.code in ('launch.view','launch.edit','launch.research.manage','launch.sourcing.manage','launch.sample.manage','launch.hpp.manage','launch.spec.manage','launch.qc.manage','launch.media.manage'));

-- Preserve existing Supabase Auth users while rebuilding their application profiles.
insert into public.profiles(id, username, full_name, job_title, avatar_url, is_active)
select
  u.id,
  lower(regexp_replace(coalesce(nullif(u.raw_user_meta_data->>'username',''), split_part(u.email,'@',1), 'anggota-' || left(u.id::text,8)), '[^a-zA-Z0-9._-]', '', 'g')),
  coalesce(nullif(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'name',''), initcap(split_part(u.email,'@',1)), 'Anggota Tim'),
  nullif(u.raw_user_meta_data->>'job_title',''),
  nullif(u.raw_user_meta_data->>'avatar_url',''),
  true
from auth.users u
on conflict (id) do update set full_name = excluded.full_name, avatar_url = excluded.avatar_url, is_active = true;

insert into public.user_roles(user_id, role_id)
select p.id, r.id
from public.profiles p
join public.roles r on r.code = case
  when lower(p.full_name) like '%gugun%' or p.username like '%gugun%' then 'owner'
  when lower(p.full_name) like '%dodi%' or p.username like '%dodi%' then 'product_lead'
  when lower(p.full_name) like '%syaikhu%' or p.username like '%syaikhu%' then 'sourcing_lead'
  when lower(p.full_name) like '%yadi%' or p.username like '%yadi%' then 'production_qc'
  else 'product_team'
end
on conflict do nothing;

-- Ensure there is always one owner during the first deployment.
insert into public.user_roles(user_id, role_id)
select p.id, r.id from public.profiles p cross join public.roles r
where r.code = 'owner'
  and p.id = (select id from public.profiles order by created_at limit 1)
  and not exists (
    select 1 from public.user_roles ur join public.roles rr on rr.id = ur.role_id where rr.code = 'owner'
  )
on conflict do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','suppliers','materials','launch_projects','launch_stage_runs','launch_tasks'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_active);
$$;

create or replace function public.has_permission(permission_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pr on pr.id = ur.user_id and pr.is_active
    where ur.user_id = auth.uid() and p.code = permission_code
  );
$$;

create or replace function public.my_permissions()
returns table(code text) language sql stable security definer set search_path = public as $$
  select distinct p.code from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid();
$$;

create or replace function public.resolve_login_email(p_identifier text)
returns text language sql stable security definer set search_path = public, auth as $$
  select u.email from auth.users u
  join public.profiles p on p.id = u.id
  where p.is_active and (lower(p.username) = lower(trim(p_identifier)) or lower(u.email) = lower(trim(p_identifier)))
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant execute on function public.my_permissions() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.role_user(p_role_code text, p_fallback uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce((select ur.user_id from public.user_roles ur join public.roles r on r.id = ur.role_id join public.profiles p on p.id = ur.user_id and p.is_active where r.code = p_role_code order by ur.assigned_at limit 1), p_fallback);
$$;

create or replace function public.generate_launch_code()
returns text language sql volatile set search_path = public as $$
  select 'PLA-' || to_char(current_date, 'YYMM') || '-' || lpad(nextval('public.launch_project_code_seq')::text, 4, '0');
$$;

create or replace function public.create_launch_project(p_payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_project_id uuid;
  v_owner uuid := public.role_user('owner', auth.uid());
  v_product uuid := public.role_user('product_lead', auth.uid());
  v_sourcing uuid := public.role_user('sourcing_lead', auth.uid());
  v_production uuid := public.role_user('production_qc', auth.uid());
begin
  if not public.has_permission('launch.create') then raise exception 'Akses membuat artikel ditolak'; end if;
  if nullif(trim(p_payload->>'article_name'),'') is null then raise exception 'Nama artikel wajib diisi'; end if;

  insert into public.launch_projects(code, business_unit_id, owner_id, article_name, category, concept, source_notes, priority, target_date, created_by)
  values (
    public.generate_launch_code(),
    (p_payload->>'business_unit_id')::uuid,
    v_owner,
    trim(p_payload->>'article_name'),
    trim(p_payload->>'category'),
    nullif(trim(p_payload->>'concept'),''),
    nullif(trim(p_payload->>'source_notes'),''),
    coalesce(nullif(p_payload->>'priority',''),'NORMAL'),
    nullif(p_payload->>'target_date','')::date,
    auth.uid()
  ) returning id into v_project_id;

  insert into public.launch_project_members(project_id, user_id, responsibility)
  select v_project_id, id, job_title from public.profiles where is_active;

  insert into public.launch_stage_runs(project_id, code, name, position, status, owner_id, due_date) values
    (v_project_id,'BRIEF','Brief & arahan',1,'IN_PROGRESS',v_owner,current_date),
    (v_project_id,'RESEARCH','Riset artikel',2,'NOT_STARTED',v_product,current_date + 3),
    (v_project_id,'SOURCING','Bahan & supplier',3,'NOT_STARTED',v_sourcing,current_date + 7),
    (v_project_id,'SAMPLING','Sampling',4,'NOT_STARTED',v_production,current_date + 14),
    (v_project_id,'COSTING','HPP & harga',5,'NOT_STARTED',v_product,current_date + 17),
    (v_project_id,'SPECIFICATION','Warna & size chart',6,'NOT_STARTED',v_production,current_date + 20),
    (v_project_id,'QC','Quality control',7,'NOT_STARTED',v_production,current_date + 24),
    (v_project_id,'OWNER_APPROVAL','Approval owner',8,'NOT_STARTED',v_owner,current_date + 25),
    (v_project_id,'PRODUCTION_READY','Siap produksi',9,'NOT_STARTED',v_owner,current_date + 26);

  insert into public.launch_tasks(project_id, stage_code, title, status, priority, assignee_id, due_date, created_by) values
    (v_project_id,'BRIEF','Validasi arahan dan hasil yang diharapkan','TODO','HIGH',v_owner,current_date,auth.uid()),
    (v_project_id,'RESEARCH','Kumpulkan benchmark produk dan insight pasar','TODO','HIGH',v_product,current_date + 3,auth.uid()),
    (v_project_id,'SOURCING','Bandingkan bahan, supplier, MOQ, dan lead time','TODO','HIGH',v_sourcing,current_date + 7,auth.uid()),
    (v_project_id,'SAMPLING','Buat dan dokumentasikan sample pertama','TODO','HIGH',v_production,current_date + 14,auth.uid()),
    (v_project_id,'COSTING','Susun HPP dan harga rekomendasi','TODO','HIGH',v_product,current_date + 17,auth.uid()),
    (v_project_id,'SPECIFICATION','Finalkan varian warna dan size chart','TODO','NORMAL',v_production,current_date + 20,auth.uid()),
    (v_project_id,'QC','Jalankan QC pada master sample','TODO','HIGH',v_production,current_date + 24,auth.uid()),
    (v_project_id,'OWNER_APPROVAL','Berikan keputusan produksi massal','TODO','HIGH',v_owner,current_date + 25,auth.uid());

  insert into public.launch_activity(project_id, actor_id, event_type, message)
  values(v_project_id, auth.uid(), 'PROJECT_CREATED', 'membuat perintah artikel dan membuka ruang kerja.');
  return v_project_id;
end;
$$;

create or replace function public.validate_launch_gate(p_project_id uuid, p_stage_code text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return case p_stage_code
    when 'BRIEF' then exists(select 1 from public.launch_projects where id = p_project_id and concept is not null)
    when 'RESEARCH' then exists(select 1 from public.launch_references where project_id = p_project_id)
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

create or replace function public.recalculate_launch_progress(p_project_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_progress integer; v_next text;
begin
  select round(avg(case when status = 'COMPLETED' then 100 else progress end))::integer into v_progress from public.launch_stage_runs where project_id = p_project_id;
  select code into v_next from public.launch_stage_runs where project_id = p_project_id and status <> 'COMPLETED' order by position limit 1;
  update public.launch_projects
  set progress = coalesce(v_progress,0),
      current_stage = coalesce(v_next,'PRODUCTION_READY'),
      status = case
        when v_progress = 100 then 'READY_FOR_PRODUCTION'
        when exists(select 1 from public.launch_stage_runs where project_id = p_project_id and status = 'BLOCKED') then 'BLOCKED'
        when exists(select 1 from public.launch_stage_runs where project_id = p_project_id and status = 'IN_REVIEW') then 'IN_REVIEW'
        else 'ACTIVE'
      end,
      ready_at = case when v_progress = 100 then coalesce(ready_at,now()) else null end
  where id = p_project_id;
end;
$$;

create or replace function public.transition_launch_stage(p_stage_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_stage public.launch_stage_runs%rowtype;
begin
  if not public.has_permission('launch.edit') then raise exception 'Akses perubahan tahap ditolak'; end if;
  if p_status not in ('NOT_STARTED','IN_PROGRESS','WAITING','BLOCKED','IN_REVIEW','REVISION','COMPLETED') then raise exception 'Status tahap tidak valid'; end if;
  select * into v_stage from public.launch_stage_runs where id = p_stage_id for update;
  if not found then raise exception 'Tahap tidak ditemukan'; end if;
  if p_status = 'COMPLETED' and not public.validate_launch_gate(v_stage.project_id, v_stage.code) then raise exception 'Gate wajib tahap ini belum lengkap'; end if;
  update public.launch_stage_runs set status = p_status, progress = case when p_status = 'COMPLETED' then 100 when p_status = 'NOT_STARTED' then 0 else greatest(progress,10) end, started_at = case when p_status = 'IN_PROGRESS' then coalesce(started_at,now()) else started_at end, completed_at = case when p_status = 'COMPLETED' then now() else null end where id = p_stage_id;
  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata) values(v_stage.project_id, auth.uid(), 'STAGE_CHANGED', 'mengubah tahap ' || v_stage.name || ' menjadi ' || p_status, jsonb_build_object('stage',v_stage.code,'status',p_status));
  perform public.recalculate_launch_progress(v_stage.project_id);
end;
$$;

grant execute on function public.create_launch_project(jsonb) to authenticated;
grant execute on function public.transition_launch_stage(uuid,text) to authenticated;

-- Row-level security: the four-person team shares visibility; mutations follow permissions.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','roles','permissions','role_permissions','user_roles','business_units','suppliers','materials','audit_logs','launch_projects','launch_project_members','launch_stage_runs','launch_tasks','launch_references','launch_material_candidates','launch_supplier_quotes','launch_colorways','launch_samples','launch_hpp_versions','launch_hpp_lines','launch_size_charts','launch_size_chart_measurements','launch_qc_checks','launch_qc_items','launch_approvals','media_assets','launch_activity'] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_team_read on public.profiles for select to authenticated using (public.is_active_user());
create policy roles_team_read on public.roles for select to authenticated using (public.is_active_user());
create policy permissions_team_read on public.permissions for select to authenticated using (public.is_active_user());
create policy role_permissions_team_read on public.role_permissions for select to authenticated using (public.is_active_user());
create policy user_roles_team_read on public.user_roles for select to authenticated using (public.is_active_user());
create policy business_units_team_read on public.business_units for select to authenticated using (public.is_active_user());
create policy audit_team_read on public.audit_logs for select to authenticated using (public.has_permission('launch.admin'));

do $$
declare table_name text;
begin
  foreach table_name in array array['suppliers','materials','launch_projects','launch_project_members','launch_stage_runs','launch_tasks','launch_references','launch_material_candidates','launch_supplier_quotes','launch_colorways','launch_samples','launch_hpp_versions','launch_hpp_lines','launch_size_charts','launch_size_chart_measurements','launch_qc_checks','launch_qc_items','launch_approvals','media_assets','launch_activity'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_permission(''launch.view''))', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(''launch.edit'') or public.has_permission(''launch.create''))', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(''launch.edit'')) with check (public.has_permission(''launch.edit''))', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''launch.admin''))', table_name || '_delete', table_name);
  end loop;
end $$;

-- Future module boundaries share the same project without prematurely creating their tables.
comment on table public.profiles is 'Shared identity foundation: Product Launch, Attendance, and POS Seller.';
comment on table public.business_units is 'Shared business-unit master used across all GG Indo Apparel systems.';
comment on table public.suppliers is 'Shared supplier master; reusable by Product Launch and future procurement/POS.';
comment on table public.materials is 'Shared material master; reusable by launch costing and future inventory.';

commit;
