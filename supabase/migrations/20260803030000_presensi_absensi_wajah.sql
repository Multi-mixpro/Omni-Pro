-- Alur absensi: PIN -> scan wajah -> verifikasi -> clock in/out
--
-- Masalah pada portal absensi sebelumnya: seluruhnya simulasi.
--  * faceMatchScore diisi angka acak 97-99.8, bukan hasil pencocokan wajah.
--  * Jarak GPS diisi angka acak yang selalu berada di dalam geofence.
--  * Record absensi hanya dibuat di memori browser dan tidak pernah tersimpan.
--  * Clock out mengubah objek record secara langsung, tidak menyentuh database.
--
-- Selain itu ada masalah keamanan yang harus diselesaikan lebih dulu: karyawan
-- masuk lewat PIN, bukan Supabase Auth, sehingga tidak punya auth.uid(). Kalau
-- RPC absensi menerima employee_id dari browser, siapa pun yang memegang kunci
-- anon (kunci ini memang publik) bisa mengabsenkan karyawan mana pun. Karena
-- itu verifikasi PIN sekarang menerbitkan token sesi, dan seluruh RPC karyawan
-- mengenali pelakunya dari token tersebut — bukan dari parameter kiriman klien.

-- ---------------------------------------------------------------------------
-- Sesi karyawan
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS presensi.employee_sessions (
  token_hash  TEXT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES presensi.employees(id) ON DELETE CASCADE,
  device_mode VARCHAR(20) NOT NULL DEFAULT 'PERSONAL'
              CHECK (device_mode IN ('KIOSK', 'PERSONAL')),
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

-- Token hanya disimpan sebagai hash: bocornya isi tabel tidak memberi siapa pun
-- token yang bisa dipakai.
ALTER TABLE presensi.employee_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_presensi_sessions_employee
  ON presensi.employee_sessions(employee_id, expires_at DESC);

/**
 * Terjemahkan token sesi menjadi baris karyawan.
 * Dipakai internal oleh seluruh RPC karyawan; token kedaluwarsa atau dicabut
 * diperlakukan sama dengan token tidak dikenal.
 */
CREATE OR REPLACE FUNCTION presensi.session_employee(p_token TEXT)
RETURNS presensi.employees
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 32 THEN
    RAISE EXCEPTION 'Sesi tidak valid. Silakan masuk kembali dengan PIN.';
  END IF;

  SELECT e.* INTO v_emp
  FROM presensi.employee_sessions s
  JOIN presensi.employees e ON e.id = s.employee_id
  WHERE s.token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
    AND s.revoked_at IS NULL
    AND s.expires_at > NOW()
    AND e.status = 'ACTIVE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sesi berakhir atau tidak valid. Silakan masuk kembali dengan PIN.';
  END IF;

  RETURN v_emp;
END;
$$;

-- ---------------------------------------------------------------------------
-- Verifikasi PIN — sekarang sekalian menerbitkan sesi
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS presensi.verify_employee_pin(TEXT);

CREATE FUNCTION presensi.verify_employee_pin(
  p_pin         TEXT,
  p_device_mode VARCHAR DEFAULT 'PERSONAL'
)
RETURNS TABLE (
  employee_id     VARCHAR,
  employee_code   VARCHAR,
  name            VARCHAR,
  role            VARCHAR,
  unit_id         VARCHAR,
  shift_id        VARCHAR,
  avatar          TEXT,
  face_registered BOOLEAN,
  face_descriptor JSONB,
  session_token   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp             presensi.employees%rowtype;
  v_recent_failures INT;
  v_token           TEXT;
BEGIN
  IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
    RETURN;
  END IF;

  -- Rem penebakan: PIN pendek berarti ruang tebakan kecil, jadi kegagalan
  -- beruntun ditahan sementara agar percobaan massal tidak murah.
  SELECT count(*) INTO v_recent_failures
  FROM presensi.pin_attempts
  WHERE NOT succeeded AND attempted_at > NOW() - interval '5 minutes';

  IF v_recent_failures >= 20 THEN
    INSERT INTO presensi.pin_attempts (succeeded) VALUES (false);
    RAISE EXCEPTION 'Terlalu banyak percobaan PIN. Coba lagi beberapa menit lagi.';
  END IF;

  FOR v_emp IN
    SELECT * FROM presensi.employees
    WHERE pin_hash IS NOT NULL AND status = 'ACTIVE'
  LOOP
    IF v_emp.pin_hash = extensions.crypt(trim(p_pin), v_emp.pin_hash) THEN
      INSERT INTO presensi.pin_attempts (succeeded, employee_id)
      VALUES (true, v_emp.id);

      v_token := encode(extensions.gen_random_bytes(32), 'hex');

      -- Perangkat bersama berumur pendek supaya sesi tidak menggantung di
      -- tablet unit setelah karyawan pergi; ponsel pribadi lebih longgar.
      INSERT INTO presensi.employee_sessions (token_hash, employee_id, device_mode, expires_at)
      VALUES (
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_emp.id,
        COALESCE(p_device_mode, 'PERSONAL'),
        NOW() + CASE WHEN p_device_mode = 'KIOSK' THEN interval '10 minutes'
                     ELSE interval '12 hours' END
      );

      employee_id     := v_emp.id;
      employee_code   := v_emp.employee_code;
      name            := v_emp.name;
      role            := v_emp.role;
      unit_id         := v_emp.unit_id;
      shift_id        := v_emp.shift_id;
      avatar          := v_emp.avatar;
      face_registered := v_emp.face_registered;
      face_descriptor := v_emp.face_descriptor;
      session_token   := v_token;
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  INSERT INTO presensi.pin_attempts (succeeded) VALUES (false);
  RETURN;
END;
$$;

-- ---------------------------------------------------------------------------
-- Jarak ke titik unit
-- ---------------------------------------------------------------------------

/**
 * Jarak haversine dalam meter.
 *
 * Dihitung di server memakai koordinat unit dari database. Jarak kiriman
 * browser tidak dipercaya karena mudah dipalsukan dari devtools.
 */
CREATE OR REPLACE FUNCTION presensi.distance_meters(
  lat1 NUMERIC, lng1 NUMERIC, lat2 NUMERIC, lng2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT ROUND((6371000 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lng2 - lng1) / 2), 2)
  )))::numeric, 1);
$$;

-- ---------------------------------------------------------------------------
-- Wajah acuan
-- ---------------------------------------------------------------------------

/**
 * Simpan wajah acuan karyawan (descriptor + foto).
 * Descriptor dihitung di perangkat; yang dikirim hanya vektor angka, bukan
 * foto mentah, sehingga wajah acuan tidak berpindah-pindah lebih dari perlunya.
 */
CREATE OR REPLACE FUNCTION presensi.enroll_face(
  p_token         TEXT,
  p_descriptor    JSONB,
  p_reference_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
BEGIN
  v_emp := presensi.session_employee(p_token);

  IF p_descriptor IS NULL OR jsonb_array_length(p_descriptor) < 64 THEN
    RAISE EXCEPTION 'Data wajah tidak lengkap. Ulangi pendaftaran wajah.';
  END IF;

  UPDATE presensi.employees
  SET face_descriptor    = p_descriptor,
      face_reference_url = COALESCE(p_reference_url, face_reference_url),
      face_registered    = true,
      updated_at         = NOW()
  WHERE id = v_emp.id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Clock in
-- ---------------------------------------------------------------------------

/**
 * Catat absen masuk.
 *
 * Wajah yang tidak cocok TIDAK menolak absen — sesuai keputusan operasional,
 * absen tetap tercatat tetapi ditandai (is_flagged) agar pengelola meninjau.
 * Menolak otomatis berisiko: pencocokan wajah bisa meleset karena cahaya,
 * masker, atau kamera buram, dan orang yang benar-benar hadir jadi dianggap
 * tidak masuk.
 */
CREATE OR REPLACE FUNCTION presensi.clock_in(
  p_token      TEXT,
  p_lat        NUMERIC DEFAULT NULL,
  p_lng        NUMERIC DEFAULT NULL,
  p_accuracy_m NUMERIC DEFAULT NULL,
  p_face_score NUMERIC DEFAULT NULL,
  p_photo_url  TEXT    DEFAULT NULL,
  p_notes      TEXT    DEFAULT NULL
)
RETURNS presensi.attendance_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp        presensi.employees%rowtype;
  v_unit       presensi.business_units%rowtype;
  v_shift      presensi.shifts%rowtype;
  v_session    presensi.employee_sessions%rowtype;
  v_rec        presensi.attendance_records%rowtype;
  v_distance   NUMERIC;
  v_flags      TEXT[] := ARRAY[]::TEXT[];
  v_late       INT := 0;
  v_status     VARCHAR(20) := 'HADIR';
  v_local_now  TIMESTAMP;
  v_work_date  DATE;
BEGIN
  v_emp := presensi.session_employee(p_token);

  SELECT * INTO v_session FROM presensi.employee_sessions
  WHERE token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  SELECT * INTO v_unit FROM presensi.business_units WHERE id = v_emp.unit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit kerja karyawan tidak ditemukan.';
  END IF;

  SELECT * INTO v_shift FROM presensi.shifts WHERE id = v_emp.shift_id;

  -- Tanggal kerja mengikuti zona waktu unit, bukan zona server, supaya absen
  -- dini hari tidak tercatat pada tanggal yang salah.
  v_local_now := NOW() AT TIME ZONE COALESCE(v_unit.time_zone, 'Asia/Jakarta');
  v_work_date := v_local_now::date;

  IF EXISTS (
    SELECT 1 FROM presensi.attendance_records
    WHERE employee_id = v_emp.id AND work_date = v_work_date
  ) THEN
    RAISE EXCEPTION 'Anda sudah melakukan absen masuk hari ini.';
  END IF;

  -- Geofence dihitung dari koordinat unit di database.
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL
     AND v_unit.latitude IS NOT NULL AND v_unit.longitude IS NOT NULL THEN
    v_distance := presensi.distance_meters(p_lat, p_lng, v_unit.latitude, v_unit.longitude);
    IF v_distance > COALESCE(v_unit.radius_meters, 100) AND NOT COALESCE(v_unit.allow_outside_geofence, false) THEN
      v_flags := array_append(v_flags, 'DI_LUAR_GEOFENCE');
    END IF;
  ELSE
    v_flags := array_append(v_flags, 'LOKASI_TIDAK_TERSEDIA');
  END IF;

  -- Wajah: skor rendah ditandai, bukan ditolak.
  IF COALESCE(v_unit.require_biometric, true) THEN
    IF p_face_score IS NULL THEN
      v_flags := array_append(v_flags, 'TANPA_SCAN_WAJAH');
    ELSIF p_face_score < 60 THEN
      v_flags := array_append(v_flags, 'WAJAH_TIDAK_COCOK');
    END IF;
  END IF;

  -- Keterlambatan dihitung dari jam shift beserta toleransinya.
  IF v_shift.start_time IS NOT NULL THEN
    v_late := GREATEST(0, (
      EXTRACT(EPOCH FROM (v_local_now::time - v_shift.start_time)) / 60
      - COALESCE(v_shift.tolerance_minutes, 0)
    )::int);
    IF v_late > 0 THEN
      v_status := 'TERLAMBAT';
    END IF;
  END IF;

  INSERT INTO presensi.attendance_records (
    employee_id, unit_id, shift_id, work_date, check_in_at,
    check_in_lat, check_in_lng, check_in_accuracy_m, check_in_distance_m,
    check_in_photo_url, face_match_score, is_flagged, flag_reasons,
    device_mode, status, late_minutes, notes
  ) VALUES (
    v_emp.id, v_emp.unit_id, v_emp.shift_id, v_work_date, NOW(),
    p_lat, p_lng, p_accuracy_m, v_distance,
    p_photo_url, p_face_score, array_length(v_flags, 1) IS NOT NULL, v_flags,
    COALESCE(v_session.device_mode, 'PERSONAL'), v_status, v_late, NULLIF(trim(COALESCE(p_notes, '')), '')
  )
  RETURNING * INTO v_rec;

  RETURN v_rec;
END;
$$;

-- ---------------------------------------------------------------------------
-- Clock out
-- ---------------------------------------------------------------------------

/**
 * Catat absen pulang pada record hari ini.
 * Wajah tidak dipindai ulang saat pulang: identitas sudah dipastikan saat
 * masuk, dan menahan orang pulang karena kamera bermasalah tidak masuk akal.
 */
CREATE OR REPLACE FUNCTION presensi.clock_out(
  p_token     TEXT,
  p_lat       NUMERIC DEFAULT NULL,
  p_lng       NUMERIC DEFAULT NULL,
  p_photo_url TEXT    DEFAULT NULL,
  p_notes     TEXT    DEFAULT NULL
)
RETURNS presensi.attendance_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp       presensi.employees%rowtype;
  v_unit      presensi.business_units%rowtype;
  v_rec       presensi.attendance_records%rowtype;
  v_distance  NUMERIC;
  v_work_date DATE;
BEGIN
  v_emp := presensi.session_employee(p_token);

  SELECT * INTO v_unit FROM presensi.business_units WHERE id = v_emp.unit_id;
  v_work_date := (NOW() AT TIME ZONE COALESCE(v_unit.time_zone, 'Asia/Jakarta'))::date;

  SELECT * INTO v_rec FROM presensi.attendance_records
  WHERE employee_id = v_emp.id AND work_date = v_work_date
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Belum ada absen masuk hari ini, jadi belum bisa absen pulang.';
  END IF;

  IF v_rec.check_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Anda sudah absen pulang hari ini pukul %.',
      to_char(v_rec.check_out_at AT TIME ZONE COALESCE(v_unit.time_zone, 'Asia/Jakarta'), 'HH24:MI');
  END IF;

  IF p_lat IS NOT NULL AND p_lng IS NOT NULL
     AND v_unit.latitude IS NOT NULL AND v_unit.longitude IS NOT NULL THEN
    v_distance := presensi.distance_meters(p_lat, p_lng, v_unit.latitude, v_unit.longitude);
  END IF;

  UPDATE presensi.attendance_records
  SET check_out_at          = NOW(),
      check_out_lat         = p_lat,
      check_out_lng         = p_lng,
      check_out_distance_m  = v_distance,
      check_out_photo_url   = COALESCE(p_photo_url, check_out_photo_url),
      notes                 = COALESCE(NULLIF(trim(COALESCE(p_notes, '')), ''), notes)
  WHERE id = v_rec.id
  RETURNING * INTO v_rec;

  RETURN v_rec;
END;
$$;

-- ---------------------------------------------------------------------------
-- Riwayat & pengajuan izin
-- ---------------------------------------------------------------------------

/** Riwayat absensi milik pemegang sesi — tidak bisa membaca milik orang lain. */
CREATE OR REPLACE FUNCTION presensi.my_attendance(p_token TEXT, p_limit INT DEFAULT 60)
RETURNS SETOF presensi.attendance_records
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
BEGIN
  v_emp := presensi.session_employee(p_token);
  RETURN QUERY
    SELECT * FROM presensi.attendance_records
    WHERE employee_id = v_emp.id
    ORDER BY work_date DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 60), 1), 200);
END;
$$;

/** Pengajuan izin tidak masuk, dengan foto keadaan karyawan saat mengajukan. */
CREATE OR REPLACE FUNCTION presensi.submit_leave_request(
  p_token      TEXT,
  p_leave_type VARCHAR,
  p_start_date DATE,
  p_end_date   DATE,
  p_reason     TEXT,
  p_photo_url  TEXT DEFAULT NULL
)
RETURNS presensi.leave_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
  v_row presensi.leave_requests%rowtype;
BEGIN
  v_emp := presensi.session_employee(p_token);

  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Alasan izin wajib diisi minimal 5 karakter.';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  END IF;

  INSERT INTO presensi.leave_requests (
    employee_id, unit_id, leave_type, start_date, end_date,
    reason, evidence_photo_url, evidence_captured_at, status
  ) VALUES (
    v_emp.id, v_emp.unit_id, p_leave_type, p_start_date, p_end_date,
    trim(p_reason), p_photo_url,
    CASE WHEN p_photo_url IS NOT NULL THEN NOW() END,
    'SUBMITTED'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

/** Riwayat pengajuan izin milik pemegang sesi. */
CREATE OR REPLACE FUNCTION presensi.my_leave_requests(p_token TEXT)
RETURNS SETOF presensi.leave_requests
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
BEGIN
  v_emp := presensi.session_employee(p_token);
  RETURN QUERY
    SELECT * FROM presensi.leave_requests
    WHERE employee_id = v_emp.id
    ORDER BY created_at DESC
    LIMIT 50;
END;
$$;

/** Akhiri sesi saat karyawan keluar dari portal. */
CREATE OR REPLACE FUNCTION presensi.end_session(p_token TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  UPDATE presensi.employee_sessions
  SET revoked_at = NOW()
  WHERE token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
    AND revoked_at IS NULL;
$$;

-- ---------------------------------------------------------------------------
-- Hak akses
-- ---------------------------------------------------------------------------

-- session_employee dipakai internal saja; klien tidak perlu memanggilnya.
REVOKE ALL ON FUNCTION presensi.session_employee(TEXT) FROM public, anon, authenticated;

REVOKE ALL ON FUNCTION presensi.verify_employee_pin(TEXT, VARCHAR) FROM public;
GRANT EXECUTE ON FUNCTION presensi.verify_employee_pin(TEXT, VARCHAR) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION presensi.clock_in(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.clock_out(TEXT, NUMERIC, NUMERIC, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.enroll_face(TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.my_attendance(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.submit_leave_request(TEXT, VARCHAR, DATE, DATE, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.my_leave_requests(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION presensi.end_session(TEXT) TO anon, authenticated;
