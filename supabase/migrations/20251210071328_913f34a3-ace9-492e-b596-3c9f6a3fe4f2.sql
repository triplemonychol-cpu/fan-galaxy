-- Add INSERT policy for notifications table
-- Only allow notifications to be created through SECURITY DEFINER functions (like create_notification)
-- Direct inserts from regular users are denied - the SECURITY DEFINER function bypasses RLS
CREATE POLICY "System only can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Also add DELETE policy so users can clear their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);