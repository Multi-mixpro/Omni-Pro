-- Pemulihan public.business_units milik Product Launch OS.
--
-- Tabel ini tertimpa struktur presensi (id VARCHAR, 24 kolom geofence),
-- sehingga baris unit Product Launch hilang dan foreign key dari
-- launch_projects ikut terhapus. Data presensi tetap aman di schema presensi.

BEGIN;

-- 1. Pindahkan tabel presensi yang salah tempat, jangan dihapus mentah.
--    Bila isinya sama dengan yang di schema presensi, cukup dibuang.
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.business_units CASCADE;

-- 2. Bangun ulang sesuai struktur Product Launch.
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  accent_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_units_read ON public.business_units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY business_units_write ON public.business_units
  FOR ALL TO authenticated
  USING (public.has_permission('launch.admin'))
  WITH CHECK (public.has_permission('launch.admin'));

-- 3. Kembalikan unit yang dirujuk artikel. Namanya dipulihkan dari
--    paten_records milik artikel BB-CS01 ("Mainline Studio").
INSERT INTO public.business_units (id, code, name, short_name, accent_color, is_active)
VALUES ('4bad69a5-ac03-4a7a-b723-880b915fed4e', 'MAINLINE', 'Mainline Studio', 'Mainline', '#087E79', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Sambungkan kembali foreign key yang hilang.
ALTER TABLE public.launch_projects
  ADD CONSTRAINT launch_projects_business_unit_id_fkey
  FOREIGN KEY (business_unit_id) REFERENCES public.business_units(id) ON DELETE SET NULL;

COMMIT;
