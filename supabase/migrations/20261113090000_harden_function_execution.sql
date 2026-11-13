-- Reduce the public RPC surface of privileged database functions.
-- Username lookup remains deliberately available to the anonymous sign-in flow.
BEGIN;

ALTER FUNCTION public.generate_variant_sku(uuid, uuid, text)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.launch_comments_default_decision_status()
  SET search_path = pg_catalog, public;

DO $harden_public_functions$
DECLARE
  target_function regprocedure;
BEGIN
  FOR target_function IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname <> 'resolve_login_email'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',
      target_function
    );
  END LOOP;
END
$harden_public_functions$;

-- This lookup is required before a session exists when a person signs in with
-- a username. Do not expose it to signed-in users or PUBLIC by inheritance.
REVOKE EXECUTE ON FUNCTION public.resolve_login_email(text)
  FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon;

-- Future functions must opt in to browser execution explicitly.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;
