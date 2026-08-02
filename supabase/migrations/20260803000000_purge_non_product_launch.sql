-- Migration: 20260803000000_purge_non_product_launch.sql
-- Purpose: Remove all Central Attendance & non-Product Launch tables, functions, and triggers from Supabase database.
-- Product Launch OS tables (profiles, roles, user_roles, launch_projects, launch_stage_runs, launch_tasks, etc.) are 100% PRESERVED.

-- 1. Drop Attendance Tables (Cascade)
DROP TABLE IF EXISTS public.attendance_events CASCADE;
DROP TABLE IF EXISTS public.attendance_days CASCADE;
DROP TABLE IF EXISTS public.attendance_schedules CASCADE;
DROP TABLE IF EXISTS public.attendance_shift_templates CASCADE;
DROP TABLE IF EXISTS public.attendance_leave_requests CASCADE;
DROP TABLE IF EXISTS public.attendance_audit_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_face_descriptors CASCADE;
DROP TABLE IF EXISTS public.attendance_login_pins CASCADE;
DROP TABLE IF EXISTS public.attendance_memberships CASCADE;
DROP TABLE IF EXISTS public.attendance_employee_assignments CASCADE;
DROP TABLE IF EXISTS public.attendance_employees CASCADE;
DROP TABLE IF EXISTS public.attendance_locations CASCADE;
DROP TABLE IF EXISTS public.attendance_business_units CASCADE;
DROP TABLE IF EXISTS public.attendance_organizations CASCADE;

-- 2. Drop Attendance Functions & Procedures
DROP FUNCTION IF EXISTS public.verify_attendance_pin(text, text);
DROP FUNCTION IF EXISTS public.hash_attendance_pin(text);
DROP FUNCTION IF EXISTS public.handle_attendance_event_submit CASCADE;

-- 3. Cleanup Complete Log
COMMENT ON SCHEMA public IS 'Product Launch OS schema — attendance & non-launch modules purged.';
