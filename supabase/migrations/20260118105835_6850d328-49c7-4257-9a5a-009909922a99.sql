-- Fix 1: Add authorization check to add_user_points function
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id uuid, p_points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Only allow system triggers (auth.uid() IS NULL) or admins to call this
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to award points';
  END IF;
  
  UPDATE public.profiles 
  SET points = points + p_points
  WHERE id = p_user_id
  RETURNING points INTO new_points;
  
  -- Calculate level (every 100 points = 1 level)
  new_level := GREATEST(1, (new_points / 100) + 1);
  
  UPDATE public.profiles SET level = new_level WHERE id = p_user_id;
END;
$$;

-- Fix 2: Add authorization check to award_badge function
CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_badge_id uuid;
BEGIN
  -- Only allow system triggers (auth.uid() IS NULL) or admins to call this
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to award badges';
  END IF;
  
  -- Check if user already has this badge
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  RETURNING id INTO user_badge_id;
  
  RETURN user_badge_id;
END;
$$;

-- Fix 3: Prevent reported users from seeing reports about themselves
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;

-- Create new policy that excludes reports where user is the reported_user
CREATE POLICY "Users can view reports they created"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id AND (reported_user_id IS NULL OR reported_user_id != auth.uid()));

-- Fix 4: Add moderators can view all reports policy
DROP POLICY IF EXISTS "Moderators can view all reports" ON public.reports;

CREATE POLICY "Moderators can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'));

-- Fix 5: Make reactions viewable by all authenticated users (needed for reaction counts display)
DROP POLICY IF EXISTS "Users can view own reactions" ON public.reactions;

CREATE POLICY "Reactions are viewable by authenticated users"
ON public.reactions
FOR SELECT
TO authenticated
USING (true);