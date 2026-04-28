-- Add payment_mode and credit_card_id to transaction table
ALTER TABLE public.transaction ADD COLUMN payment_mode varchar;
ALTER TABLE public.transaction ADD COLUMN credit_card_id bigint;

-- Add foreign key constraint
ALTER TABLE public.transaction ADD CONSTRAINT transaction_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(id) ON DELETE SET NULL;

-- Copy data from expense to transaction
UPDATE public.transaction t
SET payment_mode = e.payment_mode,
    credit_card_id = e.credit_card_id
FROM public.expense e
WHERE t.id = e.id;
