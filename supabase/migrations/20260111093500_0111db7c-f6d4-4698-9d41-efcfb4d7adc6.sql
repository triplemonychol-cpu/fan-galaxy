-- Add length constraints to posts table
ALTER TABLE public.posts ADD CONSTRAINT posts_title_length CHECK (length(title) <= 200);
ALTER TABLE public.posts ADD CONSTRAINT posts_content_length CHECK (length(content) <= 10000);

-- Add length constraint to comments table
ALTER TABLE public.comments ADD CONSTRAINT comments_content_length CHECK (length(content) <= 2000);

-- Add length constraints to groups table
ALTER TABLE public.groups ADD CONSTRAINT groups_name_length CHECK (length(name) <= 100);
ALTER TABLE public.groups ADD CONSTRAINT groups_description_length CHECK (length(description) <= 2000);

-- Add length constraints to reports table
ALTER TABLE public.reports ADD CONSTRAINT reports_reason_length CHECK (length(reason) <= 200);
ALTER TABLE public.reports ADD CONSTRAINT reports_description_length CHECK (length(description) <= 2000);

-- Add length constraints to polls table
ALTER TABLE public.polls ADD CONSTRAINT polls_question_length CHECK (length(question) <= 500);

-- Add length constraint to poll_options table
ALTER TABLE public.poll_options ADD CONSTRAINT poll_options_text_length CHECK (length(option_text) <= 200);

-- Add length constraints to reactions table
ALTER TABLE public.reactions ADD CONSTRAINT reactions_type_length CHECK (length(reaction_type) <= 50);

-- Add length constraints to categories table
ALTER TABLE public.categories ADD CONSTRAINT categories_name_length CHECK (length(name) <= 100);
ALTER TABLE public.categories ADD CONSTRAINT categories_description_length CHECK (length(description) <= 500);

-- Add length constraints to badges table
ALTER TABLE public.badges ADD CONSTRAINT badges_name_length CHECK (length(name) <= 100);
ALTER TABLE public.badges ADD CONSTRAINT badges_description_length CHECK (length(description) <= 500);

-- Add length constraint to notifications table
ALTER TABLE public.notifications ADD CONSTRAINT notifications_title_length CHECK (length(title) <= 200);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_message_length CHECK (length(message) <= 1000);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_link_length CHECK (length(link) <= 500);