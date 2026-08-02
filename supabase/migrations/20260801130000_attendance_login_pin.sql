-- Login PIN untuk Central Attendance (mode kios / perangkat bersama)
--
-- Kebutuhan: layar Attendance cukup meminta PIN, tanpa username.
--
-- Catatan keamanan yang disengaja:
--  * PIN disimpan sebagai hash bcrypt, TIDAK pernah sebagai teks polos.
--  * Pencocokan dilakukan di server lewat SECURITY DEFINER; klien tidak pernah
--    membaca tabel PIN maupun daftar hash-nya.
--  * Tabel ini tidak memiliki policy SELECT untuk pengguna biasa, sehingga
--    tidak bisa dibaca dari klien walau memakai anon key.
--  * PIN pendek berarti ruang tebakan kecil; percobaan dicatat agar
--    penyalahgunaan dapat terlihat pada audit.

CREATE TABLE IF NOT EXISTS public.attendance_login_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.attendance_login_pins ENABLE ROW LEVEL SECURITY;

-- Sengaja tanpa policy: hanya fungsi SECURITY DEFINER di bawah yang boleh
-- menyentuh tabel ini. Klien tidak pernah membacanya secara langsung.

CREATE INDEX IF NOT EXISTS idx_att_login_pins_active
  ON public.attendance_login_pins(is_active);

-- Catatan percobaan PIN, untuk audit dan deteksi penyalahgunaan.
CREATE TABLE IF NOT EXISTS public.attendance_pin_attempts (
  id BIGSERIAL PRIMARY KEY,
  succeeded BOOLEAN NOT NULL,
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_att_pin_attempts_time
  ON public.attendance_pin_attempts(attempted_at DESC);

/**
 * Cocokkan PIN dan kembalikan email akun pemiliknya.
 *
 * Hanya mengembalikan email; verifikasi kredensial tetap dilakukan Supabase
 * Auth memakai PIN tersebut sebagai password akun. Dengan begitu tidak ada
 * jalur masuk yang melewati Auth.
 */
CREATE OR REPLACE FUNCTION public.resolve_attendance_pin(p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_row public.attendance_login_pins%rowtype;
  v_email text;
  v_recent_failures int;
begin
  if p_pin is null or length(trim(p_pin)) < 4 then
    return null;
  end if;

  -- Rem sederhana: bila gagal beruntun terlalu sering dalam waktu dekat,
  -- tolak sementara agar penebakan massal tidak murah.
  select count(*) into v_recent_failures
  from public.attendance_pin_attempts
  where not succeeded
    and attempted_at > now() - interval '5 minutes';

  if v_recent_failures >= 20 then
    insert into public.attendance_pin_attempts (succeeded) values (false);
    raise exception 'Terlalu banyak percobaan PIN. Coba lagi beberapa menit lagi.';
  end if;

  for v_row in
    select * from public.attendance_login_pins where is_active
  loop
    if v_row.pin_hash = extensions.crypt(trim(p_pin), v_row.pin_hash) then
      select email into v_email from auth.users where id = v_row.user_id;

      update public.attendance_login_pins
      set last_used_at = now()
      where id = v_row.id;

      insert into public.attendance_pin_attempts (succeeded, matched_user_id)
      values (true, v_row.user_id);

      return v_email;
    end if;
  end loop;

  insert into public.attendance_pin_attempts (succeeded) values (false);
  return null;
end;
$$;

REVOKE ALL ON FUNCTION public.resolve_attendance_pin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_attendance_pin(text) TO anon, authenticated;

/**
 * Tetapkan atau perbarui PIN milik seorang pengguna Attendance.
 * PIN disimpan sebagai hash bcrypt; nilai polos tidak pernah tersimpan.
 */
CREATE OR REPLACE FUNCTION public.set_attendance_pin(p_user_id uuid, p_pin text, p_label text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
begin
  if p_pin is null or length(trim(p_pin)) < 4 then
    raise exception 'PIN minimal 4 digit.';
  end if;

  insert into public.attendance_login_pins (user_id, pin_hash, label)
  values (p_user_id, extensions.crypt(trim(p_pin), extensions.gen_salt('bf')), p_label)
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash,
        label = coalesce(excluded.label, public.attendance_login_pins.label),
        is_active = true;
end;
$$;

REVOKE ALL ON FUNCTION public.set_attendance_pin(uuid, text, text) FROM public;
