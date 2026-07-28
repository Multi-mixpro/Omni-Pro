-- Blueprint bagian 16 (supplier_materials): hubungkan master material dengan
-- master supplier, sehingga satu material dapat memiliki beberapa sumber
-- belanja (supplier) beserta harga, MOQ, dan lead time masing-masing.

begin;

create table if not exists public.material_suppliers (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  is_primary boolean not null default false,
  unit_price numeric(12,2),
  price_unit text,
  moq numeric(12,2),
  lead_time_days integer,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, supplier_id)
);

create index if not exists material_suppliers_material_idx on public.material_suppliers(material_id);
create index if not exists material_suppliers_supplier_idx on public.material_suppliers(supplier_id);

alter table public.material_suppliers enable row level security;

create policy material_suppliers_read on public.material_suppliers
  for select using (has_permission('launch.view'));

create policy material_suppliers_insert on public.material_suppliers
  for insert with check (has_permission('launch.edit') or has_permission('launch.create'));

create policy material_suppliers_update on public.material_suppliers
  for update using (has_permission('launch.edit')) with check (has_permission('launch.edit'));

create policy material_suppliers_delete on public.material_suppliers
  for delete using (has_permission('launch.admin'));

drop trigger if exists set_updated_at on public.material_suppliers;
create trigger set_updated_at before update on public.material_suppliers
  for each row execute function public.set_updated_at();

comment on table public.material_suppliers is 'Sumber belanja bahan baku: material master terhubung ke satu atau beberapa supplier master beserta harga/MOQ/lead time (Blueprint bagian 16 - supplier_materials).';

commit;
