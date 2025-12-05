-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Poll votes are viewable by everyone" ON public.poll_votes;

-- Create a new policy that only allows users to see their own votes
CREATE POLICY "Users can view own votes"
ON public.poll_votes
FOR SELECT
USING (auth.uid() = user_id);