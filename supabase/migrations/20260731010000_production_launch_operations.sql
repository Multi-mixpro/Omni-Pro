-- Operational continuation of Product Launch OS:
-- reusable cost components, mass-production monitoring, and launch readiness.

begin;

create table if not exists public.cost_components (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('MATERIAL','ACCESSORY','LABOR','PRINTING','EMBROIDERY','PACKAGING','OVERHEAD','OTHER')),
  calculation_method text not null default 'PER_UNIT' check (calculation_method in ('PER_UNIT','PER_BATCH','PERCENTAGE','FIXED')),
  unit text not null default 'pcs',
  default_price numeric(16,2),
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_production_batches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  batch_code text not null,
  vendor_name text,
  planned_start date,
  target_finish date,
  actual_start date,
  actual_finish date,
  total_quantity integer not null default 0 check (total_quantity >= 0),
  cutting_progress integer not null default 0 check (cutting_progress between 0 and 100),
  sewing_progress integer not null default 0 check (sewing_progress between 0 and 100),
  finishing_progress integer not null default 0 check (finishing_progress between 0 and 100),
  qc_progress integer not null default 0 check (qc_progress between 0 and 100),
  quantity_passed integer not null default 0 check (quantity_passed >= 0),
  quantity_rejected integer not null default 0 check (quantity_rejected >= 0),
  quantity_reworked integer not null default 0 check (quantity_reworked >= 0),
  status text not null default 'PLANNED' check (status in ('PLANNED','IN_PROGRESS','WAITING','COMPLETED','CANCELLED')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, batch_code)
);

create table if not exists public.launch_release_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.launch_projects(id) on delete cascade,
  final_product_name text,
  product_description text,
  selling_points text,
  retail_price numeric(16,2),
  marketing_start_date date,
  launch_date date,
  channel_links jsonb not null default '{}',
  readiness_checks jsonb not null default '{}',
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PREPARATION','WAITING_PRODUCT','READY','PUBLISHED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launch_production_batches_project_idx on public.launch_production_batches(project_id);
create index if not exists launch_production_batches_target_idx on public.launch_production_batches(target_finish);
create index if not exists launch_release_plans_launch_idx on public.launch_release_plans(launch_date);

alter table public.cost_components enable row level security;
alter table public.launch_production_batches enable row level security;
alter table public.launch_release_plans enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['cost_components','launch_production_batches','launch_release_plans'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_permission(''launch.view''))', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(''launch.edit'') or public.has_permission(''launch.create''))', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(''launch.edit'')) with check (public.has_permission(''launch.edit''))', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''launch.admin''))', table_name || '_delete', table_name);
  end loop;
end $$;

drop trigger if exists set_updated_at on public.cost_components;
create trigger set_updated_at before update on public.cost_components for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.launch_production_batches;
create trigger set_updated_at before update on public.launch_production_batches for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.launch_release_plans;
create trigger set_updated_at before update on public.launch_release_plans for each row execute function public.set_updated_at();

insert into public.cost_components(name, category, calculation_method, unit, notes)
values
  ('Cutting', 'LABOR', 'PER_UNIT', 'pcs', 'Biaya potong per produk'),
  ('Jahit / CMT', 'LABOR', 'PER_UNIT', 'pcs', 'Biaya jahit atau CMT per produk'),
  ('Finishing', 'LABOR', 'PER_UNIT', 'pcs', 'Pembersihan benang dan finishing'),
  ('Quality control', 'LABOR', 'PER_UNIT', 'pcs', 'Pemeriksaan kualitas per produk'),
  ('Packing', 'PACKAGING', 'PER_UNIT', 'pcs', 'Biaya pengemasan per produk'),
  ('Transport', 'OVERHEAD', 'PER_BATCH', 'batch', 'Pengiriman bahan atau hasil produksi'),
  ('Reject allowance', 'OVERHEAD', 'PERCENTAGE', '%', 'Cadangan produk reject'),
  ('Overhead produksi', 'OVERHEAD', 'PER_UNIT', 'pcs', 'Alokasi biaya operasional produksi')
on conflict (name) do nothing;

commit;
