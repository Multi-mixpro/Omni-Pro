-- Restore EXECUTE permission on auth user provisioning trigger functions for GoTrue (supabase_auth_admin)
-- and prevent any non-fatal provisioning exception from blocking auth.users creation.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  BEGIN
    PERFORM public.provision_auth_user(new.id);
  EXCEPTION WHEN OTHERS THEN
    -- Server endpoint (/api/team-user-create) upserts profiles and assigns roles directly.
    NULL;
  END;
  RETURN new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin, postgres, service_role;
GRANT EXECUTE ON FUNCTION public.provision_auth_user(uuid) TO supabase_auth_admin, postgres, service_role;

COMMIT;
