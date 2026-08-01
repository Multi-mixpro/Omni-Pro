-- ============================================================================
-- Migration: Central Attendance — Multi-Unit Business (ISOLATED SYSTEM)
-- ============================================================================
-- Sistem ini TERISOLASI PENUH dari Product Launch OS dan POS Seller.
-- Semua tabel menggunakan prefix "attendance_".
-- FK user hanya mengarah ke auth.users(id) (Supabase Auth bawaan),
-- TIDAK ke public.profiles (milik Product Launch OS).
-- Pegawai Bakso Ujo dapat berdiri sendiri tanpa akun Product Launch.
-- ============================================================================

-- ===========================================================================
-- BAGIAN 1: STRUKTUR ORGANISASI MULTI-UNIT
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.attendance_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  brand_color TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  geofence_radius_m NUMERIC NOT NULL DEFAULT 100,
  max_allowed_accuracy_m NUMERIC NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_unit_id, code)
);

CREATE TABLE IF NOT EXISTS public.attendance_work_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  sequence_no INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (location_id, code)
);

-- ===========================================================================
-- BAGIAN 2: IDENTITAS PEGAWAI & AKSES (TERISOLASI DARI PRODUCT LAUNCH)
-- ===========================================================================
-- user_id merujuk ke auth.users(id), bukan ke public.profiles.
-- Pegawai Bakso Ujo BOLEH tidak memiliki auth account (user_id = NULL).
-- Ketika Owner mendaftarkan pegawai via Attendance admin,
-- sistem membuat auth user baru yang terisolasi.

CREATE TABLE IF NOT EXISTS public.attendance_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Supabase Auth, BUKAN profiles
  employee_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pin_code TEXT, -- PIN 4-6 digit untuk Kiosk mode
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  primary_work_area_id UUID REFERENCES public.attendance_work_areas(id),
  job_title TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, business_unit_id, location_id)
);

-- Membership kontrol akses Attendance (TERPISAH dari role Product Launch)
CREATE TABLE IF NOT EXISTS public.attendance_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase Auth, BUKAN profiles
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'OWNER',
    'BUSINESS_UNIT_ADMIN',
    'LOCATION_MANAGER',
    'SUPERVISOR',
    'EMPLOYEE',
    'AUDITOR',
    'KIOSK'
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_att_memberships_unique_role 
ON public.attendance_memberships (
  user_id, 
  organization_id, 
  COALESCE(business_unit_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  role
);

-- ===========================================================================
-- BAGIAN 3: SHIFT TEMPLATE & PENJADWALAN
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.attendance_shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_cross_day BOOLEAN NOT NULL DEFAULT false,
  check_in_window_start_mins INTEGER NOT NULL DEFAULT 60,
  check_in_window_end_mins INTEGER NOT NULL DEFAULT 120,
  late_tolerance_mins INTEGER NOT NULL DEFAULT 15,
  early_leave_tolerance_mins INTEGER NOT NULL DEFAULT 15,
  break_duration_mins INTEGER NOT NULL DEFAULT 60,
  work_days_default JSONB NOT NULL DEFAULT '[1,2,3,4,5,6]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_unit_id, code)
);

CREATE TABLE IF NOT EXISTS public.attendance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.attendance_employee_assignments(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  work_area_id UUID REFERENCES public.attendance_work_areas(id),
  shift_template_id UUID NOT NULL REFERENCES public.attendance_shift_templates(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  is_off BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, schedule_date)
);

-- ===========================================================================
-- BAGIAN 4: EVENT PRESENSI (IMMUTABLE LOG)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  work_area_id UUID REFERENCES public.attendance_work_areas(id),
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.attendance_employee_assignments(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.attendance_schedules(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END')),
  occurred_at_server TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_captured_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy_m NUMERIC NOT NULL,
  distance_m NUMERIC NOT NULL,
  geofence_status TEXT NOT NULL CHECK (geofence_status IN ('WITHIN_GEOFENCE', 'OUTSIDE_GEOFENCE')),
  photo_url TEXT,
  device_id TEXT,
  source TEXT NOT NULL DEFAULT 'MOBILE_PWA',
  risk_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: tidak ada UPDATE atau DELETE yang diperbolehkan oleh RLS
-- Event asli tidak pernah diubah; koreksi disimpan terpisah.

-- ===========================================================================
-- BAGIAN 5: RINGKASAN HARIAN (DIHITUNG OTOMATIS)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.attendance_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.attendance_schedules(id),
  work_date DATE NOT NULL,
  check_in_event_id UUID REFERENCES public.attendance_events(id),
  check_out_event_id UUID REFERENCES public.attendance_events(id),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  late_mins INTEGER NOT NULL DEFAULT 0,
  early_leave_mins INTEGER NOT NULL DEFAULT 0,
  work_duration_mins INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ABSENT' CHECK (status IN (
    'PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT',
    'ON_LEAVE', 'HOLIDAY', 'OFF', 'NEEDS_REVIEW'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

-- ===========================================================================
-- BAGIAN 6: IZIN, KOREKSI & AUDIT LOG (TERISOLASI)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.attendance_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('SICK', 'ANNUAL_LEAVE', 'PERMISSION', 'BUSINESS_TRIP')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  approved_by UUID REFERENCES auth.users(id), -- Supabase Auth, BUKAN profiles
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID NOT NULL REFERENCES public.attendance_business_units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  attendance_day_id UUID REFERENCES public.attendance_days(id),
  original_event_id UUID REFERENCES public.attendance_events(id),
  correction_type TEXT NOT NULL DEFAULT 'TIME_CHANGE' CHECK (correction_type IN ('TIME_CHANGE', 'ADD_MISSING', 'VOID')),
  requested_check_in TIMESTAMPTZ,
  requested_check_out TIMESTAMPTZ,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES auth.users(id), -- Supabase Auth, BUKAN profiles
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log TERPISAH dari public.audit_logs milik Product Launch
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES public.attendance_business_units(id),
  actor_user_id UUID REFERENCES auth.users(id), -- Supabase Auth, BUKAN profiles
  actor_employee_id UUID REFERENCES public.attendance_employees(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kebijakan per-level yang bisa di-override (Organization > Unit > Location)
CREATE TABLE IF NOT EXISTS public.attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES public.attendance_business_units(id),
  location_id UUID REFERENCES public.attendance_locations(id),
  policy_key TEXT NOT NULL,
  policy_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_att_policies_unique_key 
ON public.attendance_policies (
  organization_id, 
  COALESCE(business_unit_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  policy_key
);

-- Hari libur
CREATE TABLE IF NOT EXISTS public.attendance_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  business_unit_id UUID REFERENCES public.attendance_business_units(id),
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  is_national BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- BAGIAN 7: INDEKS PERFORMA
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_att_events_employee_date ON public.attendance_events(employee_id, occurred_at_server);
CREATE INDEX IF NOT EXISTS idx_att_events_unit_date ON public.attendance_events(business_unit_id, occurred_at_server);
CREATE INDEX IF NOT EXISTS idx_att_events_idem ON public.attendance_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_att_days_employee_date ON public.attendance_days(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_att_days_unit_date ON public.attendance_days(business_unit_id, work_date);
CREATE INDEX IF NOT EXISTS idx_att_sched_employee_date ON public.attendance_schedules(employee_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_att_leave_employee ON public.attendance_leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_att_corr_employee ON public.attendance_corrections(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_att_audit_entity ON public.attendance_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_att_employees_user ON public.attendance_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_att_memberships_user ON public.attendance_memberships(user_id);

-- ===========================================================================
-- BAGIAN 8: ROW LEVEL SECURITY (TERISOLASI)
-- ===========================================================================

ALTER TABLE public.attendance_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_holidays ENABLE ROW LEVEL SECURITY;

-- Helper: Cek apakah user memiliki membership Attendance aktif
CREATE OR REPLACE FUNCTION public.get_attendance_membership_role(p_org_id UUID, p_unit_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.attendance_memberships
  WHERE user_id = auth.uid()
    AND organization_id = p_org_id
    AND is_active = true
    AND (
      business_unit_id IS NULL  -- Owner/SuperAdmin (lintas unit)
      OR business_unit_id = p_unit_id
    )
  ORDER BY CASE role
    WHEN 'OWNER' THEN 1
    WHEN 'BUSINESS_UNIT_ADMIN' THEN 2
    WHEN 'LOCATION_MANAGER' THEN 3
    WHEN 'SUPERVISOR' THEN 4
    WHEN 'EMPLOYEE' THEN 5
    ELSE 6
  END
  LIMIT 1;
$$;

-- Helper: Cek apakah user punya membership Attendance aktif (boolean)
CREATE OR REPLACE FUNCTION public.has_attendance_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendance_memberships
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Helper: Ambil employee_id berdasarkan auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_attendance_employee_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.attendance_employees
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- RLS: Struktur organisasi — hanya user Attendance
DROP POLICY IF EXISTS "att_org_select" ON public.attendance_organizations;
CREATE POLICY "att_org_select" ON public.attendance_organizations
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_unit_select" ON public.attendance_business_units;
CREATE POLICY "att_unit_select" ON public.attendance_business_units
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_loc_select" ON public.attendance_locations;
CREATE POLICY "att_loc_select" ON public.attendance_locations
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_wa_select" ON public.attendance_work_areas;
CREATE POLICY "att_wa_select" ON public.attendance_work_areas
  FOR SELECT USING (public.has_attendance_access());

-- RLS: Pegawai — hanya user Attendance
DROP POLICY IF EXISTS "att_emp_select" ON public.attendance_employees;
CREATE POLICY "att_emp_select" ON public.attendance_employees
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_assign_select" ON public.attendance_employee_assignments;
CREATE POLICY "att_assign_select" ON public.attendance_employee_assignments
  FOR SELECT USING (public.has_attendance_access());

-- RLS: Membership — user hanya lihat milik sendiri (kecuali admin)
DROP POLICY IF EXISTS "att_mem_select" ON public.attendance_memberships;
CREATE POLICY "att_mem_select" ON public.attendance_memberships
  FOR SELECT USING (public.has_attendance_access());

-- RLS: Shift & Jadwal
DROP POLICY IF EXISTS "att_shift_select" ON public.attendance_shift_templates;
CREATE POLICY "att_shift_select" ON public.attendance_shift_templates
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_sched_select" ON public.attendance_schedules;
CREATE POLICY "att_sched_select" ON public.attendance_schedules
  FOR SELECT USING (public.has_attendance_access());

-- RLS: Event presensi — hanya user Attendance, insert diizinkan
DROP POLICY IF EXISTS "att_event_select" ON public.attendance_events;
CREATE POLICY "att_event_select" ON public.attendance_events
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_event_insert" ON public.attendance_events;
CREATE POLICY "att_event_insert" ON public.attendance_events
  FOR INSERT WITH CHECK (public.has_attendance_access());

-- Event TIDAK boleh diupdate atau didelete (immutable)

-- RLS: Ringkasan harian
DROP POLICY IF EXISTS "att_day_select" ON public.attendance_days;
CREATE POLICY "att_day_select" ON public.attendance_days
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_day_insert" ON public.attendance_days;
CREATE POLICY "att_day_insert" ON public.attendance_days
  FOR INSERT WITH CHECK (public.has_attendance_access());

DROP POLICY IF EXISTS "att_day_update" ON public.attendance_days;
CREATE POLICY "att_day_update" ON public.attendance_days
  FOR UPDATE USING (public.has_attendance_access());

-- RLS: Izin & Koreksi
DROP POLICY IF EXISTS "att_leave_select" ON public.attendance_leave_requests;
CREATE POLICY "att_leave_select" ON public.attendance_leave_requests
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_leave_insert" ON public.attendance_leave_requests;
CREATE POLICY "att_leave_insert" ON public.attendance_leave_requests
  FOR INSERT WITH CHECK (public.has_attendance_access());

DROP POLICY IF EXISTS "att_corr_select" ON public.attendance_corrections;
CREATE POLICY "att_corr_select" ON public.attendance_corrections
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_corr_insert" ON public.attendance_corrections;
CREATE POLICY "att_corr_insert" ON public.attendance_corrections
  FOR INSERT WITH CHECK (public.has_attendance_access());

-- RLS: Audit, Policies, Holidays
DROP POLICY IF EXISTS "att_audit_select" ON public.attendance_audit_logs;
CREATE POLICY "att_audit_select" ON public.attendance_audit_logs
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_policy_select" ON public.attendance_policies;
CREATE POLICY "att_policy_select" ON public.attendance_policies
  FOR SELECT USING (public.has_attendance_access());

DROP POLICY IF EXISTS "att_holiday_select" ON public.attendance_holidays;
CREATE POLICY "att_holiday_select" ON public.attendance_holidays
  FOR SELECT USING (public.has_attendance_access());

-- ===========================================================================
-- BAGIAN 9: SEEDING DATA AWAL (BAKSO UJO + STRUCTURE READY)
-- ===========================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_unit_ujo_id UUID;
  v_unit_gg_id UUID;
  v_unit_gud_id UUID;
  v_loc_id UUID;
BEGIN
  -- 1. Organisasi
  INSERT INTO public.attendance_organizations (name, code, timezone)
  VALUES ('Gugun Business Group', 'GBG', 'Asia/Jakarta')
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  -- 2. Unit Bisnis (Bakso Ujo aktif, GG Supply & GUDSKUY siap)
  INSERT INTO public.attendance_business_units (organization_id, name, code, brand_color, is_active) VALUES
    (v_org_id, 'Bakso Ujo', 'BAKSO_UJO', '#f97316', true),
    (v_org_id, 'GG Supply', 'GG_SUPPLY', '#2878e6', true),
    (v_org_id, 'GUDSKUY', 'GUDSKUY', '#8b5cf6', true)
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO v_unit_ujo_id FROM public.attendance_business_units WHERE code = 'BAKSO_UJO';
  SELECT id INTO v_unit_gg_id FROM public.attendance_business_units WHERE code = 'GG_SUPPLY';
  SELECT id INTO v_unit_gud_id FROM public.attendance_business_units WHERE code = 'GUDSKUY';

  -- 3. Lokasi: Bakso Ujo Outlet Utama
  INSERT INTO public.attendance_locations (organization_id, business_unit_id, name, code, address, latitude, longitude, geofence_radius_m)
  VALUES (v_org_id, v_unit_ujo_id, 'Outlet Utama Bakso Ujo', 'UJO_MAIN', 'Jl. Utama Bakso Ujo No. 1', -6.9175, 107.6191, 150)
  ON CONFLICT (business_unit_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_loc_id;

  -- 4. Area Kerja: Bakso Ujo Outlet Utama
  INSERT INTO public.attendance_work_areas (location_id, name, code, sequence_no) VALUES
    (v_loc_id, 'Produksi', 'PRODUKSI', 1),
    (v_loc_id, 'Persiapan', 'PERSIAPAN', 2),
    (v_loc_id, 'Dapur', 'DAPUR', 3),
    (v_loc_id, 'Service', 'SERVICE', 4),
    (v_loc_id, 'Kasir', 'KASIR', 5),
    (v_loc_id, 'Minuman', 'MINUMAN', 6),
    (v_loc_id, 'Closing', 'CLOSING', 7)
  ON CONFLICT (location_id, code) DO NOTHING;

  -- 5. Template Shift: Bakso Ujo
  INSERT INTO public.attendance_shift_templates (organization_id, business_unit_id, name, code, start_time, end_time, is_cross_day, break_duration_mins) VALUES
    (v_org_id, v_unit_ujo_id, 'Produksi Dini Hari', 'SHIFT_PROD_DINI', '03:00:00', '15:00:00', false, 60),
    (v_org_id, v_unit_ujo_id, 'Produksi Pagi A', 'SHIFT_PROD_PAGI_A', '05:00:00', '17:00:00', false, 60),
    (v_org_id, v_unit_ujo_id, 'Produksi Pagi B', 'SHIFT_PROD_PAGI_B', '06:00:00', '18:00:00', false, 60),
    (v_org_id, v_unit_ujo_id, 'Persiapan & Service', 'SHIFT_PREP_SERVICE', '09:00:00', '21:00:00', false, 60),
    (v_org_id, v_unit_ujo_id, 'Outlet & Closing', 'SHIFT_OUTLET_CLOSE', '10:00:00', '22:00:00', false, 60)
  ON CONFLICT (business_unit_id, code) DO NOTHING;

  -- 6. Pegawai Awal (TANPA user_id — mereka belum punya auth account)
  INSERT INTO public.attendance_employees (organization_id, employee_no, full_name, email) VALUES
    (v_org_id, 'UJO-001', 'Dede', 'dede@baksoujo.com'),
    (v_org_id, 'UJO-002', 'Uus', 'uus@baksoujo.com'),
    (v_org_id, 'UJO-003', 'Findy', 'findy@baksoujo.com'),
    (v_org_id, 'UJO-004', 'Citra', 'citra@baksoujo.com'),
    (v_org_id, 'UJO-005', 'Onong', 'onong@baksoujo.com')
  ON CONFLICT (employee_no) DO NOTHING;

  -- 7. Assignment pegawai ke Outlet Utama Bakso Ujo
  INSERT INTO public.attendance_employee_assignments (employee_id, business_unit_id, location_id, job_title)
  SELECT e.id, v_unit_ujo_id, v_loc_id,
    CASE e.employee_no
      WHEN 'UJO-001' THEN 'Staf Produksi'
      WHEN 'UJO-002' THEN 'Staf Produksi / Service'
      WHEN 'UJO-003' THEN 'Staf Persiapan & Service'
      WHEN 'UJO-004' THEN 'Staf Outlet & Closing'
      WHEN 'UJO-005' THEN 'Staf Service & Operasional'
    END
  FROM public.attendance_employees e
  WHERE e.employee_no IN ('UJO-001', 'UJO-002', 'UJO-003', 'UJO-004', 'UJO-005')
  ON CONFLICT (employee_id, business_unit_id, location_id) DO NOTHING;

  -- 8. Kebijakan default organisasi
  INSERT INTO public.attendance_policies (organization_id, policy_key, policy_value) VALUES
    (v_org_id, 'require_photo', '"true"'::jsonb),
    (v_org_id, 'require_geofence', '"true"'::jsonb),
    (v_org_id, 'max_accuracy_m', '50'::jsonb),
    (v_org_id, 'allow_offline_queue', '"false"'::jsonb),
    (v_org_id, 'correction_window_days', '3'::jsonb),
    (v_org_id, 'media_retention_days', '365'::jsonb)
  ON CONFLICT DO NOTHING;

END $$;
