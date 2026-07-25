-- Migration 03: Username & PIN Authentication Support

-- Add username and pin_hash columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Create index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
