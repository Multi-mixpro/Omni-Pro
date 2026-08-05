-- Track user activity: last time they were active in the app
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

UPDATE public.profiles SET last_seen_at = updated_at WHERE last_seen_at IS NULL;

-- Allow users to update their own last_seen_at
CREATE POLICY profiles_self_update_last_seen
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
