ALTER TABLE public.transaction_group
ADD COLUMN IF NOT EXISTS use_group_categories BOOLEAN NOT NULL DEFAULT false;

UPDATE public.transaction_group
SET use_group_categories = true
WHERE shared = true;
