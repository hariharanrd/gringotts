-- Add credit_card_id to scheduled_transaction
ALTER TABLE scheduled_transaction ADD COLUMN credit_card_id bigint;
ALTER TABLE scheduled_transaction ADD CONSTRAINT scheduled_transaction_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(id) ON DELETE SET NULL;
