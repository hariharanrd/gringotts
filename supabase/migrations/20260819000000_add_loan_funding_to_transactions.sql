-- Migration to add funding_loan_id to transaction and scheduled_transaction tables

-- 1. Add funding_loan_id to public.transaction
ALTER TABLE public.transaction ADD COLUMN funding_loan_id BIGINT;

ALTER TABLE public.transaction ADD CONSTRAINT fk_transaction_funding_loan
    FOREIGN KEY (funding_loan_id) REFERENCES public.loan(id) ON DELETE RESTRICT;

CREATE INDEX idx_transaction_funding_loan ON public.transaction(funding_loan_id);

-- 2. Add funding_loan_id to public.scheduled_transaction
ALTER TABLE public.scheduled_transaction ADD COLUMN funding_loan_id BIGINT;

ALTER TABLE public.scheduled_transaction ADD CONSTRAINT fk_scheduled_transaction_funding_loan
    FOREIGN KEY (funding_loan_id) REFERENCES public.loan(id) ON DELETE SET NULL;

CREATE INDEX idx_scheduled_transaction_funding_loan ON public.scheduled_transaction(funding_loan_id);
