-- Blueprint Tahap 4 (Variant Planning): matriks kombinasi warna x ukuran
-- dengan SKU dan status per kombinasi, terpisah dari daftar warna itu sendiri.

begin;

create table if not exists public.launch_variant_matrix (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  colorway_id uuid not null references public.launch_colorways(id) on delete cascade,
  size text not null,
  sku text,
  status text not null default 'DRAFT' check (status in ('DRAFT','SAMPLE_ONLY','APPROVED','PRODUCTION_READY','DISABLED')),
  min_quantity integer,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (colorway_id, size)
);

create index if not exists launch_variant_matrix_project_idx on public.launch_variant_matrix(project_id);

alter table public.launch_variant_matrix enable row level security;

create policy launch_variant_matrix_read on public.launch_variant_matrix
  for select using (has_permission('launch.view'));

create policy launch_variant_matrix_insert on public.launch_variant_matrix
  for insert with check (has_permission('launch.edit') or has_permission('launch.create'));

create policy launch_variant_matrix_update on public.launch_variant_matrix
  for update using (has_permission('launch.edit')) with check (has_permission('launch.edit'));

create policy launch_variant_matrix_delete on public.launch_variant_matrix
  for delete using (has_permission('launch.admin'));

drop trigger if exists set_updated_at on public.launch_variant_matrix;
create trigger set_updated_at before update on public.launch_variant_matrix
  for each row execute function public.set_updated_at();

-- SKU otomatis: KODEARTIKEL-KODEWARNA-UKURAN, dapat ditimpa manual setelahnya.
create or replace function public.generate_variant_sku(p_project_id uuid, p_colorway_id uuid, p_size text)
returns text language sql stable as $$
  select upper(
    coalesce((select code from public.launch_projects where id = p_project_id), 'ART') || '-' ||
    coalesce((select nullif(regexp_replace(color_code, '[^a-zA-Z0-9]', '', 'g'), '') from public.launch_colorways where id = p_colorway_id),
             (select left(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'), 4) from public.launch_colorways where id = p_colorway_id)) || '-' ||
    regexp_replace(p_size, '[^a-zA-Z0-9]', '', 'g')
  );
$$;

comment on table public.launch_variant_matrix is 'Matriks kombinasi warna x ukuran per artikel (Blueprint Tahap 4 - Variant Planning).';

commit;
