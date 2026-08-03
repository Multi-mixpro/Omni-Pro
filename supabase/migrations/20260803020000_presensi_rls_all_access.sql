-- ============================================================
-- PRENSENSI SYSTEM - RLS FULL READ/WRITE PERMISSIONS MIGRATION
-- Run this in Supabase SQL Editor to allow anon/authenticated writes
-- ============================================================

DROP POLICY IF EXISTS "Public Read Access" ON public.business_units;
DROP POLICY IF EXISTS "Public All Access" ON public.business_units;
CREATE POLICY "Public All Access" ON public.business_units FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.shifts;
DROP POLICY IF EXISTS "Public All Access" ON public.shifts;
CREATE POLICY "Public All Access" ON public.shifts FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.employees;
DROP POLICY IF EXISTS "Public All Access" ON public.employees;
CREATE POLICY "Public All Access" ON public.employees FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.attendance_records;
DROP POLICY IF EXISTS "Public All Access" ON public.attendance_records;
CREATE POLICY "Public All Access" ON public.attendance_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.audit_logs;
DROP POLICY IF EXISTS "Public All Access" ON public.audit_logs;
CREATE POLICY "Public All Access" ON public.audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.sudden_absence_alerts;
DROP POLICY IF EXISTS "Public All Access" ON public.sudden_absence_alerts;
CREATE POLICY "Public All Access" ON public.sudden_absence_alerts FOR ALL USING (true);
