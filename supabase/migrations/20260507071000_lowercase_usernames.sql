-- Lowercase all existing usernames in app_user and trusted_browser tables
UPDATE public.app_user SET username = LOWER(username);
UPDATE public.trusted_browser SET username = LOWER(username);
