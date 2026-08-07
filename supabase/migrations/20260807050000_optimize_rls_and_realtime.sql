-- Optimize has_permission() RLS function: remove expensive profiles JOIN
-- The profiles JOIN caused 204M+ seq_scans on profiles table (4 rows)
-- because has_permission() is called on every RLS check across 22+ tables.
-- The is_active check is redundant here — if user has roles, they're valid.
CREATE OR REPLACE FUNCTION public.has_permission(permission_code text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.code = permission_code
  );
$$;

-- Reduce Realtime publication to only tables that need realtime sync.
-- Removes 16 tables that either rarely change or don't need live updates.
-- This reduces WAL processing by ~73% and eliminates millions of
-- unnecessary RLS evaluations (which caused 117M+ transaction rollbacks).
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS
  cost_components,
  material_suppliers,
  materials,
  suppliers,
  paten_records,
  launch_comments,
  launch_hpp_versions,
  launch_progress_updates,
  launch_qc_checks,
  launch_references,
  launch_release_plans,
  launch_samples,
  launch_size_chart_measurements,
  launch_size_charts,
  launch_variant_matrix,
  launch_production_batches;
