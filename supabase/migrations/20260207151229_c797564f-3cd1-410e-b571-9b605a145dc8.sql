
-- Fix infinite recursion: create a security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Drop the broken policy
DROP POLICY IF EXISTS "Group members visibility based on group privacy" ON public.group_members;

-- Recreate without infinite recursion
CREATE POLICY "Group members visibility based on group privacy"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND (
      g.is_private = false
      OR
      public.is_group_member(group_members.group_id, auth.uid())
    )
  )
);
