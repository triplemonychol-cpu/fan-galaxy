-- Fix 1: Restrict posts table to authenticated users only (previously was USING true which exposed author_id to unauthenticated users)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Posts are viewable by authenticated users"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Restrict group_members visibility for private groups
-- Members of private groups should only be visible to other members of that group
DROP POLICY IF EXISTS "Group members are viewable by authenticated users" ON public.group_members;

-- Public groups: anyone authenticated can see members
-- Private groups: only members can see other members
CREATE POLICY "Group members visibility based on group privacy"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND (
      -- Public groups: all authenticated users can see members
      g.is_private = false
      OR
      -- Private groups: only members can see other members
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
      )
    )
  )
);

-- Also fix comments table to require authentication (currently USING true)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments are viewable by authenticated users"
ON public.comments
FOR SELECT
TO authenticated
USING (true);