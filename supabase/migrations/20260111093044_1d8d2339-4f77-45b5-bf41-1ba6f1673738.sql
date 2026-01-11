-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own reports or admins view all" ON public.reports;

-- Create policy for users to view only their own reports
CREATE POLICY "Users can view own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Create policy for admins to view all reports (they need full access for accountability)
CREATE POLICY "Admins can view all reports" 
ON public.reports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create an anonymized view for moderators that hides reporter identity
CREATE OR REPLACE VIEW public.moderation_reports
WITH (security_invoker = true) AS
SELECT 
  id,
  reported_user_id,
  post_id,
  comment_id,
  reason,
  description,
  status,
  created_at,
  resolved_at
FROM public.reports
WHERE has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role);

-- Grant access to the view for authenticated users
GRANT SELECT ON public.moderation_reports TO authenticated;