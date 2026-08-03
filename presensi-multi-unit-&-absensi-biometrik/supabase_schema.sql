-- ============================================================
-- UNIFIED ABSENSI ENTERPRISE - SUPABASE DATABASE SCHEMA DDL
-- Execute this SQL script in Supabase SQL Editor
-- ============================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. DROP OLD CONFLICTING TABLES IF ANY
DROP TABLE IF EXISTS public.sudden_absence_alerts CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.business_units CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 1. BUSINESS UNITS TABLE
CREATE TABLE public.business_units (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tagline VARCHAR(255),
  category VARCHAR(100),
  icon_name VARCHAR(50),
  color VARCHAR(20),
  address TEXT NOT NULL,
  province VARCHAR(100),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  landmark TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_meters INT NOT NULL DEFAULT 100,
  total_employees INT DEFAULT 0,
  wifi_ssid VARCHAR(100),
  wifi_bssid VARCHAR(100),
  allow_outside_geofence BOOLEAN DEFAULT FALSE,
  require_biometric BOOLEAN DEFAULT TRUE,
  operating_hours VARCHAR(100),
  time_zone VARCHAR(50),
  manager_name VARCHAR(100),
  manager_phone VARCHAR(50),
  manager_email VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS public.shifts (
  id VARCHAR(50) PRIMARY KEY,
  unit_id VARCHAR(50) REFERENCES public.business_units(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- e.g. "08:00"
  end_time VARCHAR(10) NOT NULL,   -- e.g. "17:00"
  tolerance_minutes INT DEFAULT 15,
  color VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id VARCHAR(50) PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  unit_id VARCHAR(50) REFERENCES public.business_units(id) ON DELETE CASCADE,
  avatar TEXT,
  email VARCHAR(100),
  phone VARCHAR(50),
  shift_id VARCHAR(50) REFERENCES public.shifts(id) ON DELETE SET NULL,
  face_registered BOOLEAN DEFAULT TRUE,
  registered_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  portal_access_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(100) NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  unit_id VARCHAR(50) REFERENCES public.business_units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_name VARCHAR(100),
  check_in_time VARCHAR(20),
  check_out_time VARCHAR(20),
  status VARCHAR(20) NOT NULL, -- 'HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPHA', 'LIBUR'
  geofence_status VARCHAR(20) DEFAULT 'VALID', -- 'VALID', 'INVALID', 'OUT_OF_RANGE'
  distance_meters NUMERIC(8,2) DEFAULT 0,
  face_match_score NUMERIC(5,2) DEFAULT 0,
  photo_url TEXT,
  location_name TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id VARCHAR(50),
  user_name VARCHAR(100),
  user_role VARCHAR(100),
  unit_id VARCHAR(50),
  action TEXT NOT NULL,
  category VARCHAR(50),
  ip_address VARCHAR(50),
  device VARCHAR(100),
  details TEXT,
  status VARCHAR(20) DEFAULT 'SUCCESS'
);

-- 6. SUDDEN ABSENCE ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.sudden_absence_alerts (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(100) NOT NULL,
  unit_id VARCHAR(50) REFERENCES public.business_units(id) ON DELETE CASCADE,
  unit_name VARCHAR(100),
  shift_name VARCHAR(100),
  scheduled_time VARCHAR(20),
  detected_at VARCHAR(50),
  status VARCHAR(30) DEFAULT 'UNEXPLAINED',
  severity VARCHAR(20) DEFAULT 'HIGH',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Enable Read/Write for Anon Key or authenticated users)
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sudden_absence_alerts ENABLE ROW LEVEL SECURITY;

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

-- SEED DATA: BUSINESS UNITS
INSERT INTO public.business_units (id, name, tagline, category, icon_name, color, address, province, city, postal_code, landmark, latitude, longitude, radius_meters, total_employees, wifi_ssid, wifi_bssid, allow_outside_geofence, require_biometric, operating_hours, time_zone, manager_name, manager_phone, manager_email)
VALUES 
('GG_SUPPLY', 'GG Supply', 'Logistik & Distribusi Supply Chain', 'Logistik & Armada', 'Truck', '#3B82F6', 'Jl. TB Simatupang No. 88, Cilandak, Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan', '12430', 'Gedung Cibis Nine Tower B, Lantai 5', -6.2915000, 106.8123000, 80, 14, 'GG_Supply_Office_5G', '74:83:C2:11:4A:8B', false, true, '07:30 - 18:00 WIB', 'WIB (UTC+7)', 'Bambang Supriyadi', '+62 812-9876-5432', 'bambang.s@ggsupply.co.id'),
('GDSKUY', 'GUDSKUY', 'Gudang & E-Commerce Fulfillment Center', 'Warehousing & Hub', 'Warehouse', '#10B981', 'Kawasan Industri BSD Blok C3, Tangerang Selatan', 'Banten', 'Tangerang Selatan', '15310', 'Gate Utama Gudang Hub 3', -6.3021000, 106.6542000, 100, 18, 'Gudskuy_Hub_Secure', '00:1F:D0:A2:3B:11', true, true, '08:00 - 20:00 WIB (2 Shift)', 'WIB (UTC+7)', 'Hendra Wijaya', '+62 813-1122-3344', 'hendra.w@gudskuy.com'),
('BAKSO_UJO', 'Bakso Ujo', 'Kuliner & F&B Multi-Outlet', 'Kuliner / Resto', 'Utensils', '#F59E0B', 'Jl. Riau No. 42, Citarum, Bandung', 'Jawa Barat', 'Kota Bandung', '40115', 'Resto Outlet Utama', -6.9082000, 107.6189000, 50, 12, 'BaksoUjo_Resto_POS', 'A4:C3:F0:88:99:AA', false, true, '09:00 - 22:00 WIB', 'WIB (UTC+7)', 'H. Ujo Suherman', '+62 815-6677-8899', 'ujo@baksoujo.id')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: SHIFTS
INSERT INTO public.shifts (id, unit_id, name, start_time, end_time, tolerance_minutes, color, description)
VALUES
('SHIFT_PAGI_LOGISTICS', 'GG_SUPPLY', 'Shift Pagi Distribusi', '07:30', '16:00', 15, 'bg-blue-500/20 text-blue-400 border-blue-500/30', 'Pengiriman armada & muatan pagi'),
('SHIFT_PAGI_GDSKUY', 'GDSKUY', 'Shift Pagi Fulfillment', '08:00', '17:00', 10, 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 'Picking & Packing pesanan e-commerce pagi'),
('SHIFT_OUTLET_1_BAKSO', 'BAKSO_UJO', 'Shift Dapur Pagi', '09:00', '17:30', 15, 'bg-amber-500/20 text-amber-400 border-amber-500/30', 'Persiapan kuah & bahan utama outlet')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: EMPLOYEES
INSERT INTO public.employees (id, employee_code, name, role, unit_id, avatar, email, phone, shift_id, face_registered, status, username, password)
VALUES
('EMP_GG_01', 'GGS-101', 'Andi Pratama', 'Head Driver Logistics', 'GG_SUPPLY', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'andi.pratama@ggsupply.co.id', '0812-3456-7890', 'SHIFT_PAGI_LOGISTICS', true, 'ACTIVE', 'andi.pratama', 'GGS101@pass2026'),
('EMP_GDS_01', 'GDS-201', 'Eko Prasetyo', 'Warehouse Manager', 'GDSKUY', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'eko.prasetyo@gdskuy.id', '0821-3333-4444', 'SHIFT_PAGI_GDSKUY', true, 'ACTIVE', 'eko.prasetyo', 'GDS201@pass2026'),
('EMP_BU_01', 'BUJ-301', 'Chef Ujo', 'Head Chef & Quality Lead', 'BAKSO_UJO', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', 'chef.ujo@baksoujo.com', '0856-1234-5678', 'SHIFT_OUTLET_1_BAKSO', true, 'ACTIVE', 'chef.ujo', 'BUJ301@pass2026')
ON CONFLICT (id) DO NOTHING;
