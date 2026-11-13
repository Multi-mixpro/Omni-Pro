-- Permanently purge all [DEMO] / DEMO_CREATIVE / demo.* seed data from Creative & Business Units
-- and expose public.purge_all_creative_demo_data() (SECURITY DEFINER) so the UI cleanup button
-- can also clean any future demo records regardless of client-side DELETE RLS restrictions.

BEGIN;

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
BEGIN
  -- 1. Identify demo Business Units
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_unit_ids
    FROM public.business_units
   WHERE code = 'DEMO_CREATIVE'
      OR name ILIKE '[DEMO]%'
      OR name ILIKE 'DEMO %';

  -- 2. Identify demo Campaigns
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_campaign_ids
    FROM public.creative_campaigns
   WHERE name ILIKE '[DEMO]%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- 3. Identify demo Accounts
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_account_ids
    FROM public.creative_accounts
   WHERE handle ILIKE 'demo.%'
      OR profile_url ILIKE '%example.com%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- 4. Identify demo Channel Activations
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_activation_ids
    FROM public.creative_channel_activations
   WHERE name ILIKE '[DEMO]%'
      OR campaign_id = ANY(v_demo_campaign_ids)
      OR account_id = ANY(v_demo_account_ids);

  -- 5. Identify demo Ideas
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_idea_ids
    FROM public.creative_ideas
   WHERE title ILIKE '[DEMO]%'
      OR business_unit_id = ANY(v_demo_unit_ids);

  -- 6. Identify demo Tasks
  SELECT coalesce(array_agg(id), '{}')
    INTO v_demo_task_ids
    FROM public.creative_tasks
   WHERE title ILIKE '[DEMO]%'
      OR output_url ILIKE '%example.com%'
      OR business_unit_id = ANY(v_demo_unit_ids)
      OR campaign_id = ANY(v_demo_campaign_ids)
      OR source_idea_id = ANY(v_demo_idea_ids)
      OR source_activation_id = ANY(v_demo_activation_ids);

  -- Delete dependent rows in foreign-key safe order
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

  IF to_regclass('public.business_unit_memberships') IS NOT NULL THEN
    DELETE FROM public.business_unit_memberships
     WHERE business_unit_id = ANY(v_demo_unit_ids);
  END IF;

  -- Delete DEMO_CREATIVE unit if no remaining foreign keys reference it; otherwise deactivate it
  BEGIN
    DELETE FROM public.business_units
     WHERE id = ANY(v_demo_unit_ids);
  EXCEPTION WHEN foreign_key_violation THEN
    UPDATE public.business_units
       SET is_active = false
     WHERE id = ANY(v_demo_unit_ids);
  END;

  RETURN jsonb_build_object(
    'removed_tasks', v_removed_tasks,
    'removed_ideas', v_removed_ideas,
    'removed_campaigns', v_removed_campaigns,
    'removed_activations', v_removed_activations,
    'removed_accounts', v_removed_accounts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_all_creative_demo_data() TO authenticated;

-- Execute immediately during migration
SELECT public.purge_all_creative_demo_data();

NOTIFY pgrst, 'reload schema';

COMMIT;
