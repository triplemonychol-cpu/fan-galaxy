-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own votes" ON public.poll_votes;

-- Recreate as a PERMISSIVE policy (default) that strictly limits to own votes only
CREATE POLICY "Users can view own votes" 
ON public.poll_votes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);