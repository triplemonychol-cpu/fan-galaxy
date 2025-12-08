-- Add INSERT policy for polls table - only post authors can create polls for their posts
CREATE POLICY "Post authors can create polls for their posts"
ON public.polls
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_id
    AND posts.author_id = auth.uid()
  )
);

-- Add INSERT policy for poll_options - only post authors can add options to their polls
CREATE POLICY "Post authors can add poll options"
ON public.poll_options
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls
    JOIN public.posts ON posts.id = polls.post_id
    WHERE polls.id = poll_id
    AND posts.author_id = auth.uid()
  )
);