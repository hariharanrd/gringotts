-- Make recovery_email field unique across users
ALTER TABLE public.user_recovery_info 
ADD CONSTRAINT user_recovery_info_recovery_email_key UNIQUE (recovery_email);
