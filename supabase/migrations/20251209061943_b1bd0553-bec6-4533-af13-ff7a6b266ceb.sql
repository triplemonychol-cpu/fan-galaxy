-- 1. Groups: Allow creators to UPDATE and DELETE their groups
CREATE POLICY "Group creators can update their groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.groups
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- 2. Polls: Allow post authors to UPDATE and DELETE polls
CREATE POLICY "Post authors can update their polls"
ON public.polls
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_id
    AND posts.author_id = auth.uid()
  )
);

CREATE POLICY "Post authors can delete their polls"
ON public.polls
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_id
    AND posts.author_id = auth.uid()
  )
);

-- 3. Poll Options: Allow post authors to UPDATE and DELETE
CREATE POLICY "Post authors can update poll options"
ON public.poll_options
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.polls
    JOIN public.posts ON posts.id = polls.post_id
    WHERE polls.id = poll_id
    AND posts.author_id = auth.uid()
  )
);

CREATE POLICY "Post authors can delete poll options"
ON public.poll_options
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.polls
    JOIN public.posts ON posts.id = polls.post_id
    WHERE polls.id = poll_id
    AND posts.author_id = auth.uid()
  )
);

-- 4. Poll Votes: Allow users to delete their own votes (change vote)
CREATE POLICY "Users can delete own votes"
ON public.poll_votes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Badges: Admin management policies
CREATE POLICY "Admins can insert badges"
ON public.badges
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges"
ON public.badges
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges"
ON public.badges
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Categories: Admin management policies
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. User Roles: Admin management policies
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. System function to create notifications (SECURITY DEFINER bypasses RLS)
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
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 9. System function to award badges (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.award_badge(
  p_user_id uuid,
  p_badge_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_badge_id uuid;
BEGIN
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

-- 10. Trigger to auto-award badges when user reaches point thresholds
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award badges based on points
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT NEW.id, b.id
  FROM public.badges b
  WHERE b.points_required <= NEW.points
  AND NOT EXISTS (
    SELECT 1 FROM public.user_badges ub
    WHERE ub.user_id = NEW.id AND ub.badge_id = b.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_points_updated
AFTER UPDATE OF points ON public.profiles
FOR EACH ROW
WHEN (NEW.points > OLD.points)
EXECUTE FUNCTION public.check_and_award_badges();