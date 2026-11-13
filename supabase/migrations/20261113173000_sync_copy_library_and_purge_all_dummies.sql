-- Migration: 20261113173000_sync_copy_library_and_purge_all_dummies.sql
-- 1. Creates public.creative_copy_library for cross-device copy/script syncing
-- 2. Grants DELETE on creative_ideas & adds missing columns
-- 3. Fixes purge_all_creative_demo_data() (resolves ERROR 42703 copy_version_id -> version_id)
-- 4. Purges all demo & dummy records from Creative & Paten launch tables

BEGIN;

-- 1. Dedicated Copywriting & Script Bank table
CREATE TABLE IF NOT EXISTS public.creative_copy_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'script' CHECK (format IN ('hook', 'caption', 'script', 'angle', 'hashtag', 'cta')),
  output_type text NOT NULL DEFAULT 'video' CHECK (output_type IN ('post', 'image', 'carousel', 'video', 'story', 'live', 'other', 'reels_tiktok')),
  platform text CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'marketplace', 'website', 'internal', 'other') OR platform IS NULL),
  body text NOT NULL DEFAULT '',
  business_unit_id uuid REFERENCES public.business_units(id) ON DELETE SET NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS creative_copy_lib_active_idx
  ON public.creative_copy_library (is_archived, updated_at DESC);

ALTER TABLE public.creative_copy_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.creative_copy_library FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_copy_library TO authenticated;

DROP POLICY IF EXISTS copy_library_read ON public.creative_copy_library;
CREATE POLICY copy_library_read ON public.creative_copy_library
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('creative.view')) OR
      (SELECT public.has_permission('launch.view')) OR
      (SELECT public.has_permission('launch.admin'))
    )
  );

DROP POLICY IF EXISTS copy_library_insert ON public.creative_copy_library;
CREATE POLICY copy_library_insert ON public.creative_copy_library
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('creative.edit')) OR
      (SELECT public.has_permission('launch.edit')) OR
      (SELECT public.has_permission('launch.admin'))
    )
  );

DROP POLICY IF EXISTS copy_library_update ON public.creative_copy_library;
CREATE POLICY copy_library_update ON public.creative_copy_library
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('creative.edit')) OR
      (SELECT public.has_permission('launch.edit')) OR
      (SELECT public.has_permission('launch.admin'))
    )
  )
  WITH CHECK (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('creative.edit')) OR
      (SELECT public.has_permission('launch.edit')) OR
      (SELECT public.has_permission('launch.admin'))
    )
  );

DROP POLICY IF EXISTS copy_library_delete ON public.creative_copy_library;
CREATE POLICY copy_library_delete ON public.creative_copy_library
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('creative.edit')) OR
      (SELECT public.has_permission('launch.edit')) OR
      (SELECT public.has_permission('launch.admin'))
    )
  );

-- 2. Realtime publication support for creative_copy_library
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'creative_copy_library'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_copy_library;
    END IF;
  END IF;
END $$;

-- 3. Schema tolerance: ensure creative_tasks and creative_ideas have expected columns
ALTER TABLE public.creative_tasks
  ADD COLUMN IF NOT EXISTS copy_template_id text,
  ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'video';

ALTER TABLE public.creative_ideas
  ADD COLUMN IF NOT EXISTS attached_copy_template_id text;

-- Ensure DELETE permission on creative_ideas
GRANT DELETE ON public.creative_ideas TO authenticated;

DROP POLICY IF EXISTS creative_idea_delete ON public.creative_ideas;
CREATE POLICY creative_idea_delete ON public.creative_ideas
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_active_user()) AND (
      (SELECT public.has_permission('launch.edit')) OR
      (SELECT public.has_permission('launch.admin')) OR
      (SELECT public.has_permission('creative.edit'))
    )
  );

-- 4. Purge function: fixed column names & complete demo cleanup
CREATE OR REPLACE FUNCTION public.purge_all_creative_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_demo_unit_ids uuid[];
  v_demo_campaign_ids uuid[];
  v_demo_task_ids uuid[];
  v_demo_idea_ids uuid[];
  v_demo_account_ids uuid[];
  v_demo_activation_ids uuid[];
  v_removed_tasks int := 0;
  v_removed_ideas int := 0;
  v_removed_campaigns int := 0;
  v_removed_activations int := 0;
  v_removed_accounts int := 0;
  v_removed_copy int := 0;
BEGIN
  -- Identify demo Business Units
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_unit_ids
    FROM public.business_units
   WHERE code = 'DEMO_CREATIVE'
      OR name ILIKE '[DEMO]%'
      OR name ILIKE 'DEMO %';

  -- Identify demo Campaigns
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_campaign_ids
    FROM public.creative_campaigns
   WHERE name ILIKE '[DEMO]%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- Identify demo Accounts
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_account_ids
    FROM public.creative_accounts
   WHERE handle ILIKE 'demo.%'
      OR profile_url ILIKE '%example.com%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- Identify demo Channel Activations
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_activation_ids
    FROM public.creative_channel_activations
   WHERE name ILIKE '[DEMO]%'
      OR campaign_id = ANY(v_demo_campaign_ids)
      OR account_id = ANY(v_demo_account_ids);

  -- Identify demo Ideas
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_idea_ids
    FROM public.creative_ideas
   WHERE title ILIKE '[DEMO]%'
      OR title ILIKE '[DELETED_IDEA]%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- Identify demo Tasks
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_task_ids
    FROM public.creative_tasks
   WHERE title ILIKE '[DEMO]%'
      OR output_url ILIKE '%example.com%'
      OR business_unit_id = ANY(v_demo_unit_ids)
      OR campaign_id = ANY(v_demo_campaign_ids)
      OR source_idea_id = ANY(v_demo_idea_ids)
      OR source_activation_id = ANY(v_demo_activation_ids);

  -- Delete publications & snapshots
  IF to_regclass('public.creative_publication_snapshots') IS NOT NULL AND to_regclass('public.creative_publications') IS NOT NULL THEN
    DELETE FROM public.creative_publication_snapshots
     WHERE publication_id IN (
       SELECT id FROM public.creative_publications
        WHERE task_id = ANY(v_demo_task_ids)
           OR account_id = ANY(v_demo_account_ids)
           OR published_url ILIKE '%example.com%'
     );
  END IF;

  IF to_regclass('public.creative_publications') IS NOT NULL THEN
    DELETE FROM public.creative_publications
     WHERE task_id = ANY(v_demo_task_ids)
        OR account_id = ANY(v_demo_account_ids)
        OR published_url ILIKE '%example.com%';
  END IF;

  IF to_regclass('public.creative_account_snapshots') IS NOT NULL THEN
    DELETE FROM public.creative_account_snapshots
     WHERE account_id = ANY(v_demo_account_ids);
  END IF;

  IF to_regclass('public.creative_task_events') IS NOT NULL THEN
    DELETE FROM public.creative_task_events
     WHERE task_id = ANY(v_demo_task_ids)
        OR detail ILIKE '%[DEMO]%';
  END IF;

  IF to_regclass('public.creative_task_comments') IS NOT NULL THEN
    DELETE FROM public.creative_task_comments
     WHERE task_id = ANY(v_demo_task_ids)
        OR body ILIKE '[DEMO]%';
  END IF;

  IF to_regclass('public.creative_campaign_comments') IS NOT NULL THEN
    DELETE FROM public.creative_campaign_comments
     WHERE campaign_id = ANY(v_demo_campaign_ids)
        OR body ILIKE '[DEMO]%';
  END IF;

  -- Correct column is version_id (foreign key references creative_copy_versions.id)
  IF to_regclass('public.creative_copy_decisions') IS NOT NULL AND to_regclass('public.creative_copy_versions') IS NOT NULL THEN
    DELETE FROM public.creative_copy_decisions
     WHERE version_id IN (
       SELECT id FROM public.creative_copy_versions
        WHERE task_id = ANY(v_demo_task_ids)
     );
  END IF;

  IF to_regclass('public.creative_copy_versions') IS NOT NULL THEN
    DELETE FROM public.creative_copy_versions
     WHERE task_id = ANY(v_demo_task_ids);
  END IF;

  -- Clear source_activation_id references before deleting channel activations
  UPDATE public.creative_tasks
     SET source_activation_id = NULL
   WHERE source_activation_id = ANY(v_demo_activation_ids);

  DELETE FROM public.creative_tasks
   WHERE id = ANY(v_demo_task_ids);
  GET DIAGNOSTICS v_removed_tasks = ROW_COUNT;

  DELETE FROM public.creative_channel_activations
   WHERE id = ANY(v_demo_activation_ids);
  GET DIAGNOSTICS v_removed_activations = ROW_COUNT;

  DELETE FROM public.creative_ideas
   WHERE id = ANY(v_demo_idea_ids);
  GET DIAGNOSTICS v_removed_ideas = ROW_COUNT;

  DELETE FROM public.creative_accounts
   WHERE id = ANY(v_demo_account_ids);
  GET DIAGNOSTICS v_removed_accounts = ROW_COUNT;

  DELETE FROM public.creative_campaigns
   WHERE id = ANY(v_demo_campaign_ids);
  GET DIAGNOSTICS v_removed_campaigns = ROW_COUNT;

  IF to_regclass('public.creative_copy_library') IS NOT NULL THEN
    DELETE FROM public.creative_copy_library
     WHERE title ILIKE '[DEMO]%'
        OR business_unit_id = ANY(v_demo_unit_ids);
    GET DIAGNOSTICS v_removed_copy = ROW_COUNT;
  END IF;

  IF to_regclass('public.business_unit_memberships') IS NOT NULL THEN
    DELETE FROM public.business_unit_memberships
     WHERE business_unit_id = ANY(v_demo_unit_ids);
  END IF;

  BEGIN
    DELETE FROM public.business_units
     WHERE id = ANY(v_demo_unit_ids);
  EXCEPTION WHEN foreign_key_violation THEN
    UPDATE public.business_units
       SET is_active = false
     WHERE id = ANY(v_demo_unit_ids);
  END;

  -- 5. Purge old demo tasks & mock records from Paten Product Launch tables
  IF to_regclass('public.launch_tasks') IS NOT NULL THEN
    DELETE FROM public.launch_tasks
     WHERE title ILIKE '[DEMO]%'
        OR title IN (
          'Validasi arahan dan hasil yang diharapkan',
          'Kumpulkan benchmark produk dan insight pasar',
          'Bandingkan bahan, supplier, MOQ, dan lead time',
          'Buat dan dokumentasikan sample pertama',
          'Susun HPP dan harga rekomendasi',
          'Finalkan varian warna dan size chart',
          'Jalankan QC pada master sample',
          'Berikan keputusan produksi massal'
        );
  END IF;

  IF to_regclass('public.paten_records') IS NOT NULL THEN
    DELETE FROM public.paten_records
     WHERE record_id IN (
       'art-columbia-01', 'art-1', 'art-2',
       'sup-1', 'sup-2', 'sup-3', 'sup-4',
       'mat-columbia-01', 'mat-1', 'mat-2', 'mat-3',
       'srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5',
       'tsk-col-1', 'tsk-col-2', 'tsk-1', 'tsk-2', 'tsk-3',
       'blk-1', 'dec-1', 'app-col-1', 'app-1', 'app-2',
       'upd-col-1', 'upd-1', 'upd-2'
     )
     OR record_id LIKE 'art-%'
     OR record_id LIKE 'tsk-%'
     OR record_id LIKE 'sup-%'
     OR record_id LIKE 'mat-%'
     OR record_id LIKE 'srv-%'
     OR record_id LIKE 'blk-%'
     OR record_id LIKE 'dec-%';
  END IF;

  RETURN jsonb_build_object(
    'removed_tasks', v_removed_tasks,
    'removed_ideas', v_removed_ideas,
    'removed_campaigns', v_removed_campaigns,
    'removed_activations', v_removed_activations,
    'removed_accounts', v_removed_accounts,
    'removed_copy', v_removed_copy
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_all_creative_demo_data() TO authenticated;

-- Run cleanup immediately
SELECT public.purge_all_creative_demo_data();

NOTIFY pgrst, 'reload schema';

COMMIT;
