-- Combined Master Database Setup for GG Workspace - Product Launch OS
-- Run this SQL in your Supabase SQL Editor if needed to initialize all tables and security policies.

-- 1. Snapshot Storage Table for Realtime Workspace Simulation Engine
CREATE TABLE IF NOT EXISTS public.workspace_simulation_states (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and create public access policies for simulation engine
ALTER TABLE public.workspace_simulation_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select for workspace_simulation_states" ON public.workspace_simulation_states;
CREATE POLICY "Public select for workspace_simulation_states"
  ON public.workspace_simulation_states FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert for workspace_simulation_states" ON public.workspace_simulation_states;
CREATE POLICY "Public insert for workspace_simulation_states"
  ON public.workspace_simulation_states FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update for workspace_simulation_states" ON public.workspace_simulation_states;
CREATE POLICY "Public update for workspace_simulation_states"
  ON public.workspace_simulation_states FOR UPDATE
  USING (true);

-- 2. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_simulation_states;
