-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate with SECURITY INVOKER (default, but being explicit)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  level,
  points,
  created_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;