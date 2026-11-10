-- Client access must be false; administrative SELECT access is preserved.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         OR has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES') AS anon_access,
       has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         OR has_any_column_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES') AS authenticated_access,
       has_table_privilege('service_role', c.oid, 'SELECT') AS service_role_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('_backup_base64_projects', '_backup_base64_payloads')
ORDER BY c.relname;
