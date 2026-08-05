-- Allow global chat messages (project_id = NULL) in launch_comments
ALTER TABLE public.launch_comments
  ALTER COLUMN project_id DROP NOT NULL;

-- Index for fast global chat queries
CREATE INDEX IF NOT EXISTS idx_launch_comments_global
  ON public.launch_comments (created_at DESC)
  WHERE project_id IS NULL;
