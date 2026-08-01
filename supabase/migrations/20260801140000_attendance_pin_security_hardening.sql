-- Central Attendance: hardening login PIN kios dan isolasi data per scope.
--
-- Migrasi 20260801130000 memperkenalkan prototipe PIN. Migrasi ini menutup
-- jalur prototipe yang dapat dipanggil anon, memastikan PIN tidak menjadi
-- password Supabase Auth, dan menghapus penyimpanan PIN plaintext lama.

-- Percobaan login dibatasi per fingerprint yang telah di-hash oleh endpoint
-- server. Alamat IP dan user-agent mentah tidak pernah disimpan.
ALTER TABLE public.attendance_pin_attempts
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS network_key TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_att_pin_attempts_client_failure
  ON public.attendance_pin_attempts(client_key, attempted_at DESC)
  WHERE succeeded = false;

CREATE INDEX IF NOT EXISTS idx_att_pin_attempts_network_failure
  ON public.attendance_pin_attempts(network_key, attempted_at DESC)
  WHERE succeeded = false;

-- Jalur lama mengembalikan email ke klien anonim. Seluruh verifikasi PIN kini
-- hanya dapat dilakukan service role melalui endpoint server.
REVOKE ALL ON FUNCTION public.resolve_attendance_pin(TEXT) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.resolve_attendance_pin(TEXT);

-- Tidak boleh ada PIN operasional pada tabel employee yang bisa di-select oleh
-- anggota Attendance. Hash PIN hanya hidup di attendance_login_pins.
UPDATE public.attendance_employees SET pin_code = NULL WHERE pin_code IS NOT NULL;
ALTER TABLE public.attendance_employees DROP COLUMN IF EXISTS pin_code;

/**
 * Tetapkan/perbarui PIN kios seorang pengguna Attendance.
 *
 * Hanya service role yang boleh memanggil fungsi ini. OWNER dan
 * BUSINESS_UNIT_ADMIN sengaja ditolak agar PIN pendek tidak pernah menjadi
 * jalur menuju akses istimewa.
 */
CREATE OR REPLACE FUNCTION public.set_attendance_pin(
  p_user_id UUID,
  p_pin TEXT,
  p_label TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_pin TEXT := pg_catalog.btrim(p_pin);
  v_existing public.attendance_login_pins%ROWTYPE;
BEGIN
  IF v_pin IS NULL OR v_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'PIN Attendance harus tepat 6 digit.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.attendance_employees e
    JOIN public.attendance_memberships m ON m.user_id = e.user_id
    WHERE e.user_id = p_user_id
      AND e.is_active = true
      AND m.is_active = true
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Pengguna tidak memiliki profil Attendance aktif.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.attendance_memberships m
    WHERE m.user_id = p_user_id
      AND m.is_active = true
      AND m.role IN ('OWNER', 'BUSINESS_UNIT_ADMIN')
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Akun owner/admin wajib memakai login akun, bukan PIN kios.';
  END IF;

  -- Hash bcrypt memiliki salt, sehingga constraint UNIQUE biasa tidak dapat
  -- mendeteksi PIN sama. Lock singkat mencegah dua admin menyimpan PIN sama
  -- secara bersamaan.
  LOCK TABLE public.attendance_login_pins IN SHARE ROW EXCLUSIVE MODE;

  FOR v_existing IN
    SELECT *
    FROM public.attendance_login_pins
    WHERE is_active = true AND user_id <> p_user_id
  LOOP
    IF v_existing.pin_hash = public.crypt(v_pin, v_existing.pin_hash) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'PIN tersebut sudah digunakan. Pilih PIN lain.';
    END IF;
  END LOOP;

  INSERT INTO public.attendance_login_pins (user_id, pin_hash, label, is_active)
  VALUES (
    p_user_id,
    public.crypt(v_pin, public.gen_salt('bf', 12)),
    NULLIF(pg_catalog.btrim(p_label), ''),
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        label = COALESCE(EXCLUDED.label, public.attendance_login_pins.label),
        is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_attendance_pin(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_attendance_pin(UUID, TEXT, TEXT)
  TO service_role;

/**
 * Verifikasi PIN kios dari endpoint server.
 *
 * client_key adalah HMAC/SHA-256 fingerprint yang dibuat server. Lima
 * kegagalan per fingerprint dalam lima menit memicu lock sementara. Fungsi
 * tidak dapat dipanggil dari browser memakai anon key.
 */
CREATE OR REPLACE FUNCTION public.verify_attendance_kiosk_pin(
  p_pin TEXT,
  p_client_key TEXT,
  p_network_key TEXT
)
RETURNS TABLE (
  matched_user_id UUID,
  matched_email TEXT,
  matched_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_pin TEXT := pg_catalog.btrim(p_pin);
  v_row RECORD;
  v_match_user UUID;
  v_match_email TEXT;
  v_match_role TEXT;
  v_recent_failures INTEGER;
  v_network_failures INTEGER;
  v_global_failures INTEGER;
BEGIN
  IF p_client_key IS NULL OR p_client_key !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Fingerprint perangkat tidak valid.';
  END IF;

  IF p_network_key IS NULL OR p_network_key !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Fingerprint jaringan tidak valid.';
  END IF;

  SELECT pg_catalog.count(*)::INTEGER
  INTO v_recent_failures
  FROM public.attendance_pin_attempts a
  WHERE a.client_key = p_client_key
    AND a.succeeded = false
    AND a.attempted_at > pg_catalog.now() - INTERVAL '5 minutes';

  IF v_recent_failures >= 5 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ATTENDANCE_PIN_RATE_LIMITED';
  END IF;

  SELECT pg_catalog.count(*)::INTEGER
  INTO v_network_failures
  FROM public.attendance_pin_attempts a
  WHERE a.network_key = p_network_key
    AND a.succeeded = false
    AND a.attempted_at > pg_catalog.now() - INTERVAL '5 minutes';

  IF v_network_failures >= 30 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ATTENDANCE_PIN_NETWORK_RATE_LIMITED';
  END IF;

  -- Rem darurat terhadap serangan terdistribusi. Ambangnya cukup tinggi agar
  -- satu pengguna tidak dapat memblokir seluruh lokasi sendirian.
  SELECT pg_catalog.count(*)::INTEGER
  INTO v_global_failures
  FROM public.attendance_pin_attempts a
  WHERE a.succeeded = false
    AND a.attempted_at > pg_catalog.now() - INTERVAL '1 minute';

  IF v_global_failures >= 100 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ATTENDANCE_PIN_SERVICE_BUSY';
  END IF;

  IF v_pin IS NULL OR v_pin !~ '^[0-9]{6}$' THEN
    INSERT INTO public.attendance_pin_attempts (
      succeeded, client_key, network_key, failure_reason
    ) VALUES (false, p_client_key, p_network_key, 'INVALID_FORMAT');
    RETURN;
  END IF;

  FOR v_row IN
    SELECT
      p.id AS pin_id,
      p.user_id,
      p.pin_hash,
      u.email,
      (
        SELECT m.role
        FROM public.attendance_memberships m
        WHERE m.user_id = p.user_id
          AND m.is_active = true
          AND m.role NOT IN ('OWNER', 'BUSINESS_UNIT_ADMIN')
        ORDER BY CASE m.role
          WHEN 'LOCATION_MANAGER' THEN 1
          WHEN 'SUPERVISOR' THEN 2
          WHEN 'EMPLOYEE' THEN 3
          WHEN 'AUDITOR' THEN 4
          WHEN 'KIOSK' THEN 5
          ELSE 99
        END
        LIMIT 1
      ) AS role
    FROM public.attendance_login_pins p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.is_active = true
      AND u.email IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.attendance_employees e
        WHERE e.user_id = p.user_id AND e.is_active = true
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.attendance_memberships privileged
        WHERE privileged.user_id = p.user_id
          AND privileged.is_active = true
          AND privileged.role IN ('OWNER', 'BUSINESS_UNIT_ADMIN')
      )
    ORDER BY p.id
  LOOP
    IF v_row.role IS NOT NULL
      AND v_row.pin_hash = public.crypt(v_pin, v_row.pin_hash)
    THEN
      v_match_user := v_row.user_id;
      v_match_email := v_row.email;
      v_match_role := v_row.role;
      EXIT;
    END IF;
  END LOOP;

  IF v_match_user IS NULL THEN
    INSERT INTO public.attendance_pin_attempts (
      succeeded, client_key, network_key, failure_reason
    ) VALUES (false, p_client_key, p_network_key, 'NO_MATCH');
    RETURN;
  END IF;

  UPDATE public.attendance_login_pins
  SET last_used_at = pg_catalog.now()
  WHERE user_id = v_match_user;

  INSERT INTO public.attendance_pin_attempts (
    succeeded, matched_user_id, client_key, network_key
  ) VALUES (true, v_match_user, p_client_key, p_network_key);

  RETURN QUERY SELECT v_match_user, v_match_email, v_match_role;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_attendance_kiosk_pin(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_attendance_kiosk_pin(TEXT, TEXT, TEXT)
  TO service_role;

-- Membatasi data sensitif berdasarkan pengguna atau scope pengelola.
CREATE OR REPLACE FUNCTION public.can_manage_attendance_scope(
  p_organization_id UUID,
  p_business_unit_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attendance_memberships m
    WHERE m.user_id = auth.uid()
      AND m.is_active = true
      AND m.organization_id = p_organization_id
      AND (
        m.role = 'OWNER'
        OR (
          m.role = 'BUSINESS_UNIT_ADMIN'
          AND (m.business_unit_id IS NULL OR m.business_unit_id = p_business_unit_id)
        )
        OR (
          m.role = 'LOCATION_MANAGER'
          AND (m.business_unit_id IS NULL OR m.business_unit_id = p_business_unit_id)
          AND (m.location_id IS NULL OR m.location_id = p_location_id)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_attendance_scope(UUID, UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_attendance_scope(UUID, UUID, UUID)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_manage_attendance_employee(
  p_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attendance_employees e
    JOIN public.attendance_employee_assignments a
      ON a.employee_id = e.id AND a.is_active = true
    JOIN public.attendance_business_units bu ON bu.id = a.business_unit_id
    JOIN public.attendance_memberships m
      ON m.user_id = auth.uid()
      AND m.organization_id = e.organization_id
      AND m.is_active = true
    WHERE e.id = p_employee_id
      AND (
        m.role = 'OWNER'
        OR (
          m.role = 'BUSINESS_UNIT_ADMIN'
          AND (m.business_unit_id IS NULL OR m.business_unit_id = a.business_unit_id)
        )
        OR (
          m.role = 'LOCATION_MANAGER'
          AND (m.business_unit_id IS NULL OR m.business_unit_id = a.business_unit_id)
          AND (m.location_id IS NULL OR m.location_id = a.location_id)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_attendance_employee(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_attendance_employee(UUID)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_audit_attendance_scope(
  p_organization_id UUID,
  p_business_unit_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attendance_memberships m
    WHERE m.user_id = auth.uid()
      AND m.is_active = true
      AND m.organization_id = p_organization_id
      AND (
        m.role = 'OWNER'
        OR m.role = 'AUDITOR'
        OR (
          m.role = 'BUSINESS_UNIT_ADMIN'
          AND (m.business_unit_id IS NULL OR m.business_unit_id = p_business_unit_id)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_audit_attendance_scope(UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_audit_attendance_scope(UUID, UUID)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "att_emp_select" ON public.attendance_employees;
CREATE POLICY "att_emp_select" ON public.attendance_employees
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_manage_attendance_employee(id)
  );

DROP POLICY IF EXISTS "att_mem_select" ON public.attendance_memberships;
CREATE POLICY "att_mem_select" ON public.attendance_memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_assign_select" ON public.attendance_employee_assignments;
CREATE POLICY "att_assign_select" ON public.attendance_employee_assignments
  FOR SELECT TO authenticated
  USING (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_employee(employee_id)
  );

DROP POLICY IF EXISTS "att_event_select" ON public.attendance_events;
CREATE POLICY "att_event_select" ON public.attendance_events
  FOR SELECT TO authenticated
  USING (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_event_insert" ON public.attendance_events;
CREATE POLICY "att_event_insert" ON public.attendance_events
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_day_select" ON public.attendance_days;
CREATE POLICY "att_day_select" ON public.attendance_days
  FOR SELECT TO authenticated
  USING (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_day_insert" ON public.attendance_days;
CREATE POLICY "att_day_insert" ON public.attendance_days
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_day_update" ON public.attendance_days;
CREATE POLICY "att_day_update" ON public.attendance_days
  FOR UPDATE TO authenticated
  USING (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  )
  WITH CHECK (
    employee_id = public.get_my_attendance_employee_id()
    OR public.can_manage_attendance_scope(
      organization_id, business_unit_id, location_id
    )
  );

DROP POLICY IF EXISTS "att_audit_select" ON public.attendance_audit_logs;
CREATE POLICY "att_audit_select" ON public.attendance_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.can_audit_attendance_scope(organization_id, business_unit_id)
  );

-- Riwayat percobaan PIN tidak dibuka lewat RLS; hanya service role yang dapat
-- menulis dan pengelola database yang dapat mengauditnya.
REVOKE ALL ON TABLE public.attendance_login_pins FROM anon, authenticated;
REVOKE ALL ON TABLE public.attendance_pin_attempts FROM anon, authenticated;
