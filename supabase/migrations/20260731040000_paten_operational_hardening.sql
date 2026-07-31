-- Hardening for PATEN operational sync:
-- optimistic concurrency, single primary material supplier, and realtime for
-- normalized tables now written by the PATEN workspace.

begin;

create or replace function public.save_paten_record(
  p_record_type text,
  p_record_id text,
  p_project_id uuid,
  p_payload jsonb,
  p_is_deleted boolean,
  p_expected_revision bigint default 0
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current public.paten_records%rowtype;
  v_revision bigint;
begin
  select * into v_current
  from public.paten_records
  where record_type = p_record_type and record_id = p_record_id
  for update;

  if found then
    if v_current.revision <> p_expected_revision then
      raise exception 'PATEN_CONFLICT: record changed from revision % to %',
        p_expected_revision, v_current.revision
        using errcode = '40001';
    end if;

    update public.paten_records
    set project_id = coalesce(p_project_id, project_id),
        payload = coalesce(p_payload, '{}'::jsonb),
        is_deleted = coalesce(p_is_deleted, false)
    where record_type = p_record_type and record_id = p_record_id
    returning revision into v_revision;
  else
    if p_expected_revision <> 0 then
      raise exception 'PATEN_CONFLICT: record no longer exists'
        using errcode = '40001';
    end if;

    insert into public.paten_records(
      record_type, record_id, project_id, payload, is_deleted
    )
    values(
      p_record_type, p_record_id, p_project_id,
      coalesce(p_payload, '{}'::jsonb), coalesce(p_is_deleted, false)
    )
    returning revision into v_revision;
  end if;

  return v_revision;
end;
$$;

grant execute on function public.save_paten_record(
  text, text, uuid, jsonb, boolean, bigint
) to authenticated;

create or replace function public.keep_one_primary_material_supplier()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.is_primary then
    update public.material_suppliers
    set is_primary = false
    where material_id = new.material_id
      and supplier_id <> new.supplier_id
      and is_primary;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_one_primary_material_supplier
  on public.material_suppliers;
create trigger keep_one_primary_material_supplier
before insert or update of is_primary on public.material_suppliers
for each row execute function public.keep_one_primary_material_supplier();

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'launch_colorways',
      'launch_samples',
      'launch_hpp_versions',
      'launch_size_charts',
      'launch_size_chart_measurements',
      'launch_qc_checks',
      'launch_variant_matrix',
      'launch_production_batches',
      'launch_release_plans',
      'material_suppliers'
    ]
    loop
      if to_regclass(format('public.%I', table_name)) is not null
         and not exists (
           select 1
           from pg_publication_tables
           where pubname = 'supabase_realtime'
             and schemaname = 'public'
             and tablename = table_name
         ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          table_name
        );
      end if;
    end loop;
  end if;
end;
$$;

commit;
