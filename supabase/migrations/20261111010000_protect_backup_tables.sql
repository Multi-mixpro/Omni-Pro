-- Internal backup payloads must never be available through client API roles.
-- Preserve the tables, their data, and existing administrative access.
BEGIN;

DO $backup_security$
DECLARE
  backup_name text;
  backup_oid regclass;
  column_list text;
  client_role text;
BEGIN
  FOREACH backup_name IN ARRAY ARRAY['_backup_base64_projects', '_backup_base64_payloads']
  LOOP
    backup_oid := to_regclass(format('public.%I', backup_name));
    -- These manually created backups are absent in fresh installations.
    IF backup_oid IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', backup_oid);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM PUBLIC, anon, authenticated', backup_oid);

    -- Table-level REVOKE does not remove explicit column-level grants.
    SELECT string_agg(format('%I', attname), ', ' ORDER BY attnum)
      INTO column_list
      FROM pg_attribute
      WHERE attrelid = backup_oid AND attnum > 0 AND NOT attisdropped;
    IF column_list IS NOT NULL THEN
      EXECUTE format(
        'REVOKE SELECT (%1$s), INSERT (%1$s), UPDATE (%1$s), REFERENCES (%1$s) ON TABLE %2$s FROM PUBLIC, anon, authenticated',
        column_list, backup_oid
      );
    END IF;

    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF has_table_privilege(client_role, backup_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         OR has_any_column_privilege(client_role, backup_oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
        RAISE EXCEPTION 'Backup % still accessible to %; inspect inherited grants', backup_name, client_role;
      END IF;
    END LOOP;
    -- No client policies are added: RLS defaults to denying row access.
  END LOOP;
END
$backup_security$;

COMMIT;
