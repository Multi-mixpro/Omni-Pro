-- One-time safety snapshot before the Product Launch OS v2 reset.
-- Auth, Storage, and Supabase-managed schemas are not changed.

begin;

create schema if not exists legacy_backup_20260727;

create table if not exists legacy_backup_20260727._table_manifest as
select
  table_schema,
  table_name,
  table_type,
  now() as captured_at
from information_schema.tables
where table_schema = 'public';

create table if not exists legacy_backup_20260727._view_definitions as
select
  schemaname,
  viewname,
  viewowner,
  definition,
  now() as captured_at
from pg_views
where schemaname = 'public';

create table if not exists legacy_backup_20260727._function_definitions as
select
  p.oid::regprocedure::text as routine,
  pg_get_functiondef(p.oid) as definition,
  now() as captured_at
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind in ('f', 'p');

create table if not exists legacy_backup_20260727._policy_definitions as
select
  *,
  now() as captured_at
from pg_policies
where schemaname = 'public';

do $backup$
declare
  source_table record;
begin
  for source_table in
    select tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  loop
    if to_regclass(format('legacy_backup_20260727.%I', source_table.tablename)) is null then
      execute format(
        'create table legacy_backup_20260727.%I as table public.%I',
        source_table.tablename,
        source_table.tablename
      );
    end if;
  end loop;
end
$backup$;

commit;
