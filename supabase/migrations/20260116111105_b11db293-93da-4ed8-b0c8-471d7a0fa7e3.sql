-- Add RLS policy for group_members role updates
-- Creators can update any member's role
-- Admins can only update to/from moderator role (not admin)

CREATE POLICY "Creators can update member roles"
ON public.group_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can update moderator roles"
ON public.group_members
FOR UPDATE
USING (
  -- Check if current user is an admin of this group
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  -- And the target member is not the creator
  AND NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.created_by = group_members.user_id
  )
);

-- Creators can remove any member except themselves
CREATE POLICY "Creators can remove members"
ON public.group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.created_by = auth.uid()
  )
  AND user_id != auth.uid()
);

-- Admins can remove non-admin members
CREATE POLICY "Admins can remove non-admin members"
ON public.group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  AND group_members.role NOT IN ('admin')
  AND NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.created_by = group_members.user_id
  )
);