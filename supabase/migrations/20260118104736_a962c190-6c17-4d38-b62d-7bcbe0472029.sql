-- Fix 1: Add authorization check to create_notification function
-- This prevents any authenticated user from creating notifications for any user
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Only system/triggers (when auth.uid() IS NULL) or admins can create notifications
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to create notifications';
  END IF;
  
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Fix 2: Update group_members policy to require authentication for SELECT
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON public.group_members;

CREATE POLICY "Group members are viewable by authenticated users"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

-- Fix 3: Add RLS policy to reaction_counts view
-- Note: reaction_counts is a VIEW, so we need to enable RLS on the underlying table
-- But since this is just an aggregated view, we'll add a policy for authenticated users
-- First, check if reaction_counts has RLS enabled

-- Since reaction_counts is a VIEW, we need to create it with security_invoker if not already
-- Let's drop and recreate with proper security
DROP VIEW IF EXISTS public.reaction_counts;

CREATE VIEW public.reaction_counts
WITH (security_invoker=on) AS
SELECT 
  post_id,
  comment_id,
  reaction_type,
  COUNT(*) as count
FROM public.reactions
GROUP BY post_id, comment_id, reaction_type;

-- Fix 4: Update groups policy to require authentication (fixes groups_creator_exposure)
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;

CREATE POLICY "Groups are viewable by authenticated users"
ON public.groups
FOR SELECT
TO authenticated
USING (true);