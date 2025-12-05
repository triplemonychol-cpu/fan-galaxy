-- Allow admins and moderators to update reports (change status, resolve, etc.)
CREATE POLICY "Admins and moderators can update reports"
ON public.reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Allow admins to delete reports (spam cleanup)
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
USING (has_role(auth.uid(), 'admin'));