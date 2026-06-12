-- Migration to add thumbnail column to transaction_group table
ALTER TABLE public.transaction_group
ADD COLUMN thumbnail text;
