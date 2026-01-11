-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;

-- Create new policy requiring authentication to view user badges
CREATE POLICY "User badges are viewable by authenticated users"
ON public.user_badges
FOR SELECT
TO authenticated
USING (true);