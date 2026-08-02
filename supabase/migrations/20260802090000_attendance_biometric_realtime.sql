-- Attendance production hardening:
-- 1. Private camera-based face enrollment (encrypted descriptor + private media).
-- 2. Realtime publication for the operational Attendance tables.
--
-- Face descriptors are never selectable from the browser. They are encrypted
-- by the server before insertion and only service-role API functions decrypt
-- them during attendance verification.

ALTER TABLE public.attendance_employees
  ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.attendance_biometric_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  reference_object_path TEXT NOT NULL,
  reference_sha256 TEXT NOT NULL,
  descriptor_ciphertext TEXT NOT NULL,
  descriptor_iv TEXT NOT NULL,
  descriptor_tag TEXT NOT NULL,
  descriptor_length INTEGER NOT NULL CHECK (descriptor_length BETWEEN 512 AND 2048),
  model_name TEXT NOT NULL DEFAULT 'human-faceres',
  model_version TEXT NOT NULL DEFAULT '3.3.6',
  match_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.550,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  consent_at TIMESTAMPTZ NOT NULL,
  enrolled_by UUID NOT NULL REFERENCES auth.users(id),
  last_verified_at TIMESTAMPTZ,
  verification_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.attendance_organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.attendance_employees(id) ON DELETE CASCADE,
  attendance_event_id UUID REFERENCES public.attendance_events(id) ON DELETE SET NULL,
  media_kind TEXT NOT NULL CHECK (media_kind IN ('FACE_ENROLLMENT', 'ATTENDANCE_CAPTURE')),
  storage_path TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 10240 AND 1572864),
  content_sha256 TEXT NOT NULL,
  capture_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_att_biometric_employee_active
  ON public.attendance_biometric_profiles(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_att_media_employee_time
  ON public.attendance_media(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_att_media_event
  ON public.attendance_media(attendance_event_id);

-- A schedule may only have one accepted check-in and one accepted check-out.
-- The API also uses idempotency keys; this unique index closes the remaining
-- race window when two different requests arrive at the same time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_att_events_single_punch_per_schedule
  ON public.attendance_events(employee_id, schedule_id, event_type)
  WHERE schedule_id IS NOT NULL
    AND event_type IN ('CHECK_IN', 'CHECK_OUT');

ALTER TABLE public.attendance_biometric_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_media ENABLE ROW LEVEL SECURITY;

-- Deliberately no anon/authenticated policies. Biometric descriptors and media
-- are handled only by server endpoints using the service role.
REVOKE ALL ON TABLE public.attendance_biometric_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.attendance_media FROM anon, authenticated;
GRANT ALL ON TABLE public.attendance_biometric_profiles TO service_role;
GRANT ALL ON TABLE public.attendance_media TO service_role;

-- Private bucket. Downloads require service-role mediation or a short-lived
-- signed URL; raw facial media is never public.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-private',
  'attendance-private',
  false,
  1572864,
  ARRAY['image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Postgres Changes is sufficient for the current single-site operational
-- volume. The UI keeps a slower polling fallback for reconnect recovery.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'attendance_employees',
    'attendance_employee_assignments',
    'attendance_shift_templates',
    'attendance_schedules',
    'attendance_events',
    'attendance_days',
    'attendance_audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.attendance_employees REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_employee_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_shift_templates REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_schedules REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_events REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_days REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_audit_logs REPLICA IDENTITY FULL;

COMMENT ON TABLE public.attendance_biometric_profiles IS
  'Encrypted camera face descriptors; server-only, not hardware Face ID.';
COMMENT ON TABLE public.attendance_media IS
  'Private enrollment and attendance capture media metadata.';
