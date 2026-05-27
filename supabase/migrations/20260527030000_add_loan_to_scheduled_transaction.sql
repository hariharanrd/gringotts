-- Migration: Add loan_id to scheduled_transaction
ALTER TABLE public.scheduled_transaction ADD COLUMN loan_id bigint;

-- Add foreign key constraint (SET NULL ensures deleting a loan doesn't delete the schedule)
ALTER TABLE public.scheduled_transaction ADD CONSTRAINT scheduled_transaction_loan_id_fkey
    FOREIGN KEY (loan_id) REFERENCES public.loan(id) ON DELETE SET NULL;

-- Index for efficient lookup
CREATE INDEX idx_scheduled_transaction_loan_id ON public.scheduled_transaction(loan_id);
