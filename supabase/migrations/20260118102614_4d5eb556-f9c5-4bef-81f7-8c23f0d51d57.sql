-- Create a public storage bucket for app downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-downloads', 'app-downloads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read/download files from the bucket
CREATE POLICY "Anyone can download app files"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-downloads');

-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload app files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-downloads' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);