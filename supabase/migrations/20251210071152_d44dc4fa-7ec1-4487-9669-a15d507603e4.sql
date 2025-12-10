-- Update the uploads bucket with security restrictions
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file_size_limit = 5242880  -- 5MB in bytes
WHERE id = 'uploads';

-- Add a CHECK constraint on the profiles table for username validation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_format 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');