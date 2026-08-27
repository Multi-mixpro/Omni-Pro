-- Support cursor-based polling without scanning growing operational history.
-- Safe to apply to databases that already have the original launch indexes.

CREATE INDEX IF NOT EXISTS launch_comments_created_at_idx
  ON public.launch_comments(created_at);

CREATE INDEX IF NOT EXISTS launch_projects_updated_at_idx
  ON public.launch_projects(updated_at DESC);
