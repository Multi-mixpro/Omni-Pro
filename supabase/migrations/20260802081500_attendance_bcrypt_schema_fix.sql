-- Correct the pgcrypto schema used by the Attendance PIN RPCs.
-- Existing deployments created the functions successfully, but invoking them
-- failed because pgcrypto is installed in `extensions`, not `public`.

DO $migration$
DECLARE
  v_definition TEXT;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(
    'public.set_attendance_pin(uuid,text,text)'::pg_catalog.regprocedure
  )
  INTO v_definition;

  v_definition := pg_catalog.replace(v_definition, 'public.crypt', 'extensions.crypt');
  v_definition := pg_catalog.replace(v_definition, 'public.gen_salt', 'extensions.gen_salt');
  EXECUTE v_definition;

  SELECT pg_catalog.pg_get_functiondef(
    'public.verify_attendance_kiosk_pin(text,text,text)'::pg_catalog.regprocedure
  )
  INTO v_definition;

  v_definition := pg_catalog.replace(v_definition, 'public.crypt', 'extensions.crypt');
  EXECUTE v_definition;
END;
$migration$;

COMMENT ON FUNCTION public.set_attendance_pin(UUID, TEXT, TEXT) IS
  'Sets a unique six-digit Attendance PIN using bcrypt from the extensions schema.';

COMMENT ON FUNCTION public.verify_attendance_kiosk_pin(TEXT, TEXT, TEXT) IS
  'Verifies kiosk PINs using bcrypt from the extensions schema with rate limits and audit logging.';
