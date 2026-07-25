-- Compatibility snapshot storage for the full HTML simulation workspace.
-- This preserves exact UI/UX behavior while moving persistence from browser
-- localStorage to Supabase.

CREATE TABLE IF NOT EXISTS public.workspace_simulation_states (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
