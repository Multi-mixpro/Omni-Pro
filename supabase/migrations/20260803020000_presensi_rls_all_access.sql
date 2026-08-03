-- ============================================================
-- PRENSENSI SYSTEM - RLS FULL READ/WRITE PERMISSIONS MIGRATION
-- Run this in Supabase SQL Editor to resolve 401 Unauthorized errors on POST/UPSERT
-- ============================================================

-- OPTION 1: GRANT PERMISSIVE POLICIES TO ALL TABLES (RECOMMENDED)
DROP POLICY IF EXISTS "Public Read Access" ON public.business_units;
DROP POLICY IF EXISTS "Public All Access" ON public.business_units;
CREATE POLICY "Public All Access" ON public.business_units FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.shifts;
DROP POLICY IF EXISTS "Public All Access" ON public.shifts;
CREATE POLICY "Public All Access" ON public.shifts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.employees;
DROP POLICY IF EXISTS "Public All Access" ON public.employees;
CREATE POLICY "Public All Access" ON public.employees FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.attendance_records;
DROP POLICY IF EXISTS "Public All Access" ON public.attendance_records;
CREATE POLICY "Public All Access" ON public.attendance_records FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.audit_logs;
DROP POLICY IF EXISTS "Public All Access" ON public.audit_logs;
CREATE POLICY "Public All Access" ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.sudden_absence_alerts;
DROP POLICY IF EXISTS "Public All Access" ON public.sudden_absence_alerts;
CREATE POLICY "Public All Access" ON public.sudden_absence_alerts FOR ALL TO public USING (true) WITH CHECK (true);
