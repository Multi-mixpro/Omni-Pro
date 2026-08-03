-- Login terpadu Presensi: satu pintu untuk karyawan dan pengelola
--
-- Masalah pada halaman login sebelumnya:
--  * PIN dibandingkan di sisi klien, dan '123456' serta '112233' selalu
--    diterima untuk karyawan mana pun — siapa pun yang tahu kode karyawan
--    dapat absen atas nama orang lain.
--  * Jalur admin memiliki fallback tanpa password sama sekali: mengetik
--    username apa pun langsung memberi akses Admin penuh.
--  * Pengguna harus memilih dulu mode "Karyawan" atau "Admin" sebelum masuk.
--
-- Perbaikan: verifikasi dilakukan di server (SECURITY DEFINER), PIN disimpan
-- sebagai hash bcrypt, dan peran ditentukan sistem — bukan dipilih pengguna.

-- Catatan percobaan PIN untuk audit sekaligus rem penebakan.
CREATE TABLE IF NOT EXISTS presensi.pin_attempts (
  id BIGSERIAL PRIMARY KEY,
  succeeded BOOLEAN NOT NULL,
  employee_id VARCHAR(50) REFERENCES presensi.employees(id) ON DELETE SET NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE presensi.pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_presensi_pin_attempts_time
  ON presensi.pin_attempts(attempted_at DESC);

/**
 * Tetapkan PIN karyawan. PIN disimpan sebagai hash bcrypt;
 * nilai polosnya tidak pernah tersimpan di database.
 */
CREATE OR REPLACE FUNCTION presensi.set_employee_pin(p_employee_id VARCHAR, p_pin TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
    RAISE EXCEPTION 'PIN minimal 4 digit.';
  END IF;

  UPDATE presensi.employees
  SET pin_hash = extensions.crypt(trim(p_pin), extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Karyawan % tidak ditemukan.', p_employee_id;
  END IF;
END;
$$;

/**
 * Verifikasi PIN dan kembalikan identitas karyawan.
 *
 * Pencocokan hash dilakukan di server sehingga PIN tidak pernah dibandingkan
 * di browser. Tidak ada PIN cadangan/bawaan: hanya PIN milik karyawan yang
 * bersangkutan yang diterima.
 */
CREATE OR REPLACE FUNCTION presensi.verify_employee_pin(p_pin TEXT)
RETURNS TABLE (
  employee_id VARCHAR,
  employee_code VARCHAR,
  name VARCHAR,
  role VARCHAR,
  unit_id VARCHAR,
  shift_id VARCHAR,
  avatar TEXT,
  face_registered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_emp presensi.employees%rowtype;
  v_recent_failures INT;
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

      employee_id     := v_emp.id;
      employee_code   := v_emp.employee_code;
      name            := v_emp.name;
      role            := v_emp.role;
      unit_id         := v_emp.unit_id;
      shift_id        := v_emp.shift_id;
      avatar          := v_emp.avatar;
      face_registered := v_emp.face_registered;
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  INSERT INTO presensi.pin_attempts (succeeded) VALUES (false);
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION presensi.verify_employee_pin(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION presensi.verify_employee_pin(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION presensi.set_employee_pin(VARCHAR, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION presensi.set_employee_pin(VARCHAR, TEXT) TO authenticated;

/**
 * Peran pengelola milik pengguna yang sedang login.
 * Dipakai login terpadu untuk menentukan apakah seseorang masuk sebagai
 * pengelola atau karyawan — peran ditentukan sistem, bukan dipilih pengguna.
 */
CREATE OR REPLACE FUNCTION presensi.my_manager_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT role FROM presensi.memberships
  WHERE user_id = auth.uid()
    AND is_active
    AND role IN ('OWNER', 'UNIT_MANAGER', 'SUPERVISOR')
  ORDER BY CASE role
    WHEN 'OWNER' THEN 1
    WHEN 'UNIT_MANAGER' THEN 2
    ELSE 3
  END
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION presensi.my_manager_role() TO authenticated;
