-- Alter user_recovery_info.otp column length to support secure hashing
ALTER TABLE public.user_recovery_info ALTER COLUMN otp TYPE varchar(255);

-- Seed default recovery email change limit configuration if not exists
INSERT INTO public.app_configuration (category, parameter, value)
SELECT 'RECOVERY_EMAIL_LIMIT', 'DEFAULT', '2'
WHERE NOT EXISTS (
    SELECT 1 FROM public.app_configuration 
    WHERE category = 'RECOVERY_EMAIL_LIMIT' AND parameter = 'DEFAULT'
);