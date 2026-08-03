-- Presensi Multi-Unit & Absensi Biometrik
--
-- Perbedaan penting dari file supabase_schema.sql bawaan folder:
--
-- 1. Nama tabel diberi prefix presensi_*. Nama polos business_units dan
--    audit_logs SUDAH DIPAKAI Product Launch OS — business_units bahkan
--    dirujuk foreign key oleh launch_projects. Memakai nama polos akan
--    menabrak data artikel yang sedang berjalan.
--
-- 2. Kolom password teks polos DIHAPUS, diganti pin_hash (bcrypt). Identitas
--    kru diverifikasi lewat PIN + wajah, bukan password yang bisa terbaca.
--
-- 3. Policy "USING (true)" TIDAK dipakai. Policy semacam itu membuat siapa pun
--    yang memegang anon key dapat membaca seluruh data karyawan serta
--    memalsukan/menghapus audit log. RLS di sini bersandar pada auth.uid().
--
-- Alur yang didukung: PIN -> scan wajah -> cocokkan -> absen masuk/keluar.
-- Dua mode perangkat: KIOSK (perangkat bersama outlet) dan PERSONAL (HP kru).

-- ===========================================================================
-- 1. UNIT & SHIFT
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_business_units (
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
  wifi_ssid VARCHAR(100),
  wifi_bssid VARCHAR(100),
  allow_outside_geofence BOOLEAN NOT NULL DEFAULT FALSE,
  require_biometric BOOLEAN NOT NULL DEFAULT TRUE,
  operating_hours VARCHAR(100),
  time_zone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  manager_name VARCHAR(100),
  manager_phone VARCHAR(50),
  manager_email VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.presensi_shifts (
  id VARCHAR(50) PRIMARY KEY,
  unit_id VARCHAR(50) NOT NULL REFERENCES public.presensi_business_units(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tolerance_minutes INT NOT NULL DEFAULT 15,
  crosses_midnight BOOLEAN NOT NULL DEFAULT FALSE,
  color VARCHAR(120),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================================================
-- 2. KARYAWAN
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_employees (
  id VARCHAR(50) PRIMARY KEY,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  unit_id VARCHAR(50) NOT NULL REFERENCES public.presensi_business_units(id) ON DELETE CASCADE,
  shift_id VARCHAR(50) REFERENCES public.presensi_shifts(id) ON DELETE SET NULL,
  avatar TEXT,
  email VARCHAR(100),
  phone VARCHAR(50),

  -- Akun login opsional: kru mode KIOSK tidak wajib punya akun sendiri.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- PIN disimpan sebagai hash bcrypt; nilai polos tidak pernah tersimpan.
  pin_hash TEXT,

  -- Referensi wajah untuk pencocokan biometrik.
  face_registered BOOLEAN NOT NULL DEFAULT FALSE,
  face_descriptor JSONB,
  face_reference_url TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presensi_emp_unit ON public.presensi_employees(unit_id);
CREATE INDEX IF NOT EXISTS idx_presensi_emp_user ON public.presensi_employees(user_id);

-- ===========================================================================
-- 3. CATATAN ABSEN
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) NOT NULL REFERENCES public.presensi_employees(id) ON DELETE CASCADE,
  unit_id VARCHAR(50) NOT NULL REFERENCES public.presensi_business_units(id) ON DELETE CASCADE,
  shift_id VARCHAR(50) REFERENCES public.presensi_shifts(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,

  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,

  -- Bukti lokasi
  check_in_lat NUMERIC(10, 7),
  check_in_lng NUMERIC(10, 7),
  check_in_accuracy_m NUMERIC(8, 2),
  check_in_distance_m NUMERIC(10, 2),
  check_out_lat NUMERIC(10, 7),
  check_out_lng NUMERIC(10, 7),
  check_out_distance_m NUMERIC(10, 2),

  -- Bukti biometrik
  check_in_photo_url TEXT,
  check_out_photo_url TEXT,
  face_match_score NUMERIC(5, 2),

  -- Wajah tidak cocok TIDAK menolak absen, melainkan menandainya untuk
  -- ditinjau manager. Keputusan produk: kamera outlet bisa meleset, dan
  -- menolak absen berarti kru kehilangan jam kerja yang sah.
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reasons TEXT[] NOT NULL DEFAULT '{}',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Jejak perangkat: KIOSK (perangkat bersama) atau PERSONAL (HP kru).
  device_mode VARCHAR(10) NOT NULL DEFAULT 'PERSONAL'
    CHECK (device_mode IN ('KIOSK', 'PERSONAL')),
  recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
  late_minutes INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Penjaga absen ganda: satu kru hanya punya SATU catatan per tanggal,
  -- sehingga absen dari perangkat kiosk dan HP pribadi tidak menghasilkan
  -- dua baris yang saling bertentangan.
  UNIQUE (employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_presensi_att_unit_date
  ON public.presensi_attendance_records(unit_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_presensi_att_flagged
  ON public.presensi_attendance_records(is_flagged) WHERE is_flagged;

-- ===========================================================================
-- 4. PENGAJUAN IZIN (dengan foto realtime)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) NOT NULL REFERENCES public.presensi_employees(id) ON DELETE CASCADE,
  unit_id VARCHAR(50) NOT NULL REFERENCES public.presensi_business_units(id) ON DELETE CASCADE,
  leave_type VARCHAR(30) NOT NULL
    CHECK (leave_type IN ('SICK', 'PERMISSION', 'ANNUAL_LEAVE', 'BUSINESS_TRIP', 'EMERGENCY')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,

  -- Foto keadaan karyawan saat mengajukan, diambil langsung dari kamera.
  evidence_photo_url TEXT,
  evidence_captured_at TIMESTAMPTZ,

  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')),
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_presensi_leave_emp
  ON public.presensi_leave_requests(employee_id, status);

-- ===========================================================================
-- 5. AUDIT
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  unit_id VARCHAR(50) REFERENCES public.presensi_business_units(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id VARCHAR(50) REFERENCES public.presensi_employees(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presensi_audit_time
  ON public.presensi_audit_logs(created_at DESC);

-- ===========================================================================
-- 6. KEANGGOTAAN & SCOPE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.presensi_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id VARCHAR(50) REFERENCES public.presensi_business_units(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('OWNER', 'UNIT_MANAGER', 'SUPERVISOR', 'KIOSK', 'EMPLOYEE')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, unit_id, role)
);

CREATE INDEX IF NOT EXISTS idx_presensi_member_user
  ON public.presensi_memberships(user_id) WHERE is_active;

-- Helper scope. SECURITY DEFINER + STABLE agar murah dipanggil dari policy.
CREATE OR REPLACE FUNCTION public.presensi_is_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path TO '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.presensi_memberships
    WHERE user_id = auth.uid() AND role = 'OWNER' AND is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.presensi_manages_unit(p_unit VARCHAR)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path TO '' AS $$
  SELECT public.presensi_is_owner() OR EXISTS (
    SELECT 1 FROM public.presensi_memberships
    WHERE user_id = auth.uid()
      AND is_active
      AND role IN ('UNIT_MANAGER', 'SUPERVISOR', 'KIOSK')
      AND unit_id = p_unit
  );
$$;

CREATE OR REPLACE FUNCTION public.presensi_my_employee_ids()
RETURNS SETOF VARCHAR LANGUAGE sql SECURITY DEFINER STABLE SET search_path TO '' AS $$
  SELECT id FROM public.presensi_employees WHERE user_id = auth.uid();
$$;

-- ===========================================================================
-- 7. RLS — berbasis auth.uid(), bukan USING (true)
-- ===========================================================================

ALTER TABLE public.presensi_business_units      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_shifts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_attendance_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_leave_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi_memberships         ENABLE ROW LEVEL SECURITY;

-- Unit & shift: hanya yang punya keanggotaan Presensi.
CREATE POLICY presensi_unit_read ON public.presensi_business_units
  FOR SELECT TO authenticated
  USING (public.presensi_is_owner() OR public.presensi_manages_unit(id)
         OR id IN (SELECT unit_id FROM public.presensi_employees WHERE user_id = auth.uid()));

CREATE POLICY presensi_unit_write ON public.presensi_business_units
  FOR ALL TO authenticated
  USING (public.presensi_is_owner()) WITH CHECK (public.presensi_is_owner());

CREATE POLICY presensi_shift_read ON public.presensi_shifts
  FOR SELECT TO authenticated
  USING (public.presensi_manages_unit(unit_id)
         OR unit_id IN (SELECT unit_id FROM public.presensi_employees WHERE user_id = auth.uid()));

CREATE POLICY presensi_shift_write ON public.presensi_shifts
  FOR ALL TO authenticated
  USING (public.presensi_manages_unit(unit_id)) WITH CHECK (public.presensi_manages_unit(unit_id));

-- Karyawan: kru melihat dirinya sendiri; pengelola melihat unitnya.
CREATE POLICY presensi_emp_read ON public.presensi_employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_emp_write ON public.presensi_employees
  FOR ALL TO authenticated
  USING (public.presensi_manages_unit(unit_id)) WITH CHECK (public.presensi_manages_unit(unit_id));

-- Absen: kru melihat miliknya; kiosk/pengelola menulis untuk unitnya.
CREATE POLICY presensi_att_read ON public.presensi_attendance_records
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT public.presensi_my_employee_ids())
         OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_att_insert ON public.presensi_attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT public.presensi_my_employee_ids())
              OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_att_update ON public.presensi_attendance_records
  FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT public.presensi_my_employee_ids())
         OR public.presensi_manages_unit(unit_id))
  WITH CHECK (employee_id IN (SELECT public.presensi_my_employee_ids())
              OR public.presensi_manages_unit(unit_id));

-- Izin: kru mengajukan miliknya; pengelola meninjau unitnya.
CREATE POLICY presensi_leave_read ON public.presensi_leave_requests
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT public.presensi_my_employee_ids())
         OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_leave_insert ON public.presensi_leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT public.presensi_my_employee_ids())
              OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_leave_update ON public.presensi_leave_requests
  FOR UPDATE TO authenticated
  USING (public.presensi_manages_unit(unit_id)) WITH CHECK (public.presensi_manages_unit(unit_id));

-- Audit: hanya dibaca pengelola, dan TIDAK dapat diubah/dihapus dari klien.
CREATE POLICY presensi_audit_read ON public.presensi_audit_logs
  FOR SELECT TO authenticated
  USING (public.presensi_is_owner() OR public.presensi_manages_unit(unit_id));

CREATE POLICY presensi_audit_insert ON public.presensi_audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Keanggotaan: pengguna melihat miliknya; owner mengelola semua.
CREATE POLICY presensi_member_read ON public.presensi_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.presensi_is_owner());

CREATE POLICY presensi_member_write ON public.presensi_memberships
  FOR ALL TO authenticated
  USING (public.presensi_is_owner()) WITH CHECK (public.presensi_is_owner());

-- ===========================================================================
-- 8. PINDAH KE SCHEMA TERPISAH
-- ===========================================================================
-- Pemisahan sesungguhnya dilakukan di level schema, bukan sekadar prefix nama.
-- Keuntungannya: namespace benar-benar terisolasi dari Product Launch (yang
-- memakai public.business_units dan public.audit_logs), hak akses dapat
-- diberikan per-schema, dan pengelolaan/backup bisa dipisah.
--
-- Setelah dipindah, nama tabel kembali bersih (business_units, employees,
-- shifts, ...) persis seperti skema asli folder presensi, sehingga kode
-- aplikasi cukup diarahkan ke schema ini.

CREATE SCHEMA IF NOT EXISTS presensi;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables
           WHERE schemaname = 'public' AND tablename LIKE 'presensi_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET SCHEMA presensi', r.tablename);
    EXECUTE format('ALTER TABLE presensi.%I RENAME TO %I',
                   r.tablename, replace(r.tablename, 'presensi_', ''));
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA presensi TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA presensi TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA presensi TO anon;

-- ===========================================================================
-- 9. DATA UNIT & SHIFT (konfigurasi nyata, bukan contoh)
-- ===========================================================================
-- Unit bisnis beserta koordinat geofence dan shift operasionalnya adalah
-- konfigurasi nyata yang dibutuhkan sistem untuk berjalan, sehingga tetap
-- disertakan. Yang TIDAK disertakan adalah seed karyawan contoh (nama fiktif,
-- foto stok, password tertanam) — karyawan didaftarkan lewat aplikasi.
INSERT INTO presensi.business_units (id, name, tagline, category, icon_name, color, address, province, city, postal_code, landmark, latitude, longitude, radius_meters, wifi_ssid, wifi_bssid, allow_outside_geofence, require_biometric, operating_hours, time_zone, manager_name, manager_phone, manager_email)
VALUES 
('GG_SUPPLY', 'GG Supply', 'Logistik & Distribusi Supply Chain', 'Logistik & Armada', 'Truck', '#3B82F6', 'Jl. TB Simatupang No. 88, Cilandak, Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan', '12430', 'Gedung Cibis Nine Tower B, Lantai 5', -6.2915000, 106.8123000, 80, 'GG_Supply_Office_5G', '74:83:C2:11:4A:8B', false, true, '07:30 - 18:00 WIB', 'WIB (UTC+7)', 'Bambang Supriyadi', '+62 812-9876-5432', 'bambang.s@ggsupply.co.id'),
('GDSKUY', 'GUDSKUY', 'Gudang & E-Commerce Fulfillment Center', 'Warehousing & Hub', 'Warehouse', '#10B981', 'Kawasan Industri BSD Blok C3, Tangerang Selatan', 'Banten', 'Tangerang Selatan', '15310', 'Gate Utama Gudang Hub 3', -6.3021000, 106.6542000, 100, 'Gudskuy_Hub_Secure', '00:1F:D0:A2:3B:11', true, true, '08:00 - 20:00 WIB (2 Shift)', 'WIB (UTC+7)', 'Hendra Wijaya', '+62 813-1122-3344', 'hendra.w@gudskuy.com'),
('BAKSO_UJO', 'Bakso Ujo', 'Kuliner & F&B Multi-Outlet', 'Kuliner / Resto', 'Utensils', '#F59E0B', 'Jl. Riau No. 42, Citarum, Bandung', 'Jawa Barat', 'Kota Bandung', '40115', 'Resto Outlet Utama', -6.9082000, 107.6189000, 50, 'BaksoUjo_Resto_POS', 'A4:C3:F0:88:99:AA', false, true, '09:00 - 22:00 WIB', 'WIB (UTC+7)', 'H. Ujo Suherman', '+62 815-6677-8899', 'ujo@baksoujo.id')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: SHIFTS
INSERT INTO presensi.shifts (id, unit_id, name, start_time, end_time, tolerance_minutes, color, description)
VALUES
('SHIFT_PAGI_LOGISTICS', 'GG_SUPPLY', 'Shift Pagi Distribusi', '07:30', '16:00', 15, 'bg-blue-500/20 text-blue-400 border-blue-500/30', 'Pengiriman armada & muatan pagi'),
('SHIFT_PAGI_GDSKUY', 'GDSKUY', 'Shift Pagi Fulfillment', '08:00', '17:00', 10, 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 'Picking & Packing pesanan e-commerce pagi'),
('SHIFT_OUTLET_1_BAKSO', 'BAKSO_UJO', 'Shift Dapur Pagi', '09:00', '17:30', 15, 'bg-amber-500/20 text-amber-400 border-amber-500/30', 'Persiapan kuah & bahan utama outlet')
ON CONFLICT (id) DO NOTHING;

