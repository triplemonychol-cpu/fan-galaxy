-- Add new settings columns to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS require_post_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_anonymous boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_edit_approval boolean DEFAULT false;