-- Drop the existing reports SELECT policy
DROP POLICY IF EXISTS "Users can view own reports or admins view all" ON public.reports;

-- Create new policy that explicitly requires authentication
CREATE POLICY "Users can view own reports or admins view all"
ON public.reports
FOR SELECT
TO authenticated
USING (
  auth.uid() = reporter_id 
  OR public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'moderator')
);