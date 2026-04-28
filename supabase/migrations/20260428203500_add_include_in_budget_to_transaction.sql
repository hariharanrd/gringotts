-- Add include_in_budget to transaction table
ALTER TABLE public.transaction ADD COLUMN include_in_budget boolean DEFAULT true;
