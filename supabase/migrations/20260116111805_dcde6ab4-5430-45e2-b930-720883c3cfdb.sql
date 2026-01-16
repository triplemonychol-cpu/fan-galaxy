-- Fix PUBLIC_DATA_EXPOSURE: reactions table exposes user_id publicly

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;

-- Create restricted policy: users can only view their own reactions
CREATE POLICY "Users can view own reactions" 
ON public.reactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a view for aggregate reaction counts (publicly accessible)
CREATE VIEW public.reaction_counts 
WITH (security_invoker=on) AS
SELECT 
  post_id, 
  comment_id, 
  reaction_type, 
  COUNT(*) as count
FROM public.reactions
GROUP BY post_id, comment_id, reaction_type;