-- Migration to add allowed transaction types to transaction_group table
ALTER TABLE public.transaction_group
ADD COLUMN allows_expense boolean NOT NULL DEFAULT true,
ADD COLUMN allows_income boolean NOT NULL DEFAULT true,
ADD COLUMN allows_saving boolean NOT NULL DEFAULT true,
ADD COLUMN allows_revolving boolean NOT NULL DEFAULT true;
