-- Fix: Recreate public_profiles view with security_invoker and add RLS policy

-- First, drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Add RLS policy on profiles to allow authenticated users to read public profile fields
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Recreate the view with security_invoker=on so it respects RLS
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  points,
  level,
  created_at
FROM public.profiles;