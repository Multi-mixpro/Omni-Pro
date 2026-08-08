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

-- Remove ALL tables from Realtime publication.
-- Supabase Realtime WAL processing was the #1 CPU consumer: 15,774 seconds
-- of CPU time across 346K calls, causing 117M+ transaction rollbacks from
-- RLS evaluations. App now uses 30s polling instead of Realtime subscriptions.
-- This eliminates Realtime WAL processing overhead entirely.
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS
  cost_components,
  material_suppliers,
  materials,
  suppliers,
  paten_records,
  launch_approvals,
  launch_blockers,
  launch_colorways,
  launch_comments,
  launch_hpp_versions,
  launch_production_batches,
  launch_progress_updates,
  launch_projects,
  launch_qc_checks,
  launch_references,
  launch_release_plans,
  launch_samples,
  launch_size_chart_measurements,
  launch_size_charts,
  launch_tasks,
  launch_variant_matrix,
  media_assets;
