-- Alter public.loan_part_payment to add linked transaction reference
ALTER TABLE public.loan_part_payment ADD COLUMN linked_expense_id bigint;

-- Foreign key constraint for loan_part_payment -> transaction (joined inheritance base)
ALTER TABLE public.loan_part_payment ADD CONSTRAINT fk_loan_part_payment_expense
    FOREIGN KEY (linked_expense_id) REFERENCES public.transaction(id) ON DELETE SET NULL;

-- Index for efficient lookup
CREATE INDEX idx_loan_part_payment_linked_expense_id ON public.loan_part_payment(linked_expense_id);
