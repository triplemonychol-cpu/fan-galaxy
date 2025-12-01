-- Fix function search paths using CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_group_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.groups
  SET member_count = member_count + 1
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_group_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.groups
  SET member_count = member_count - 1
  WHERE id = OLD.group_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET comment_count = comment_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET comment_count = comment_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;