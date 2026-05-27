-- Alter public.transaction to add loan linking columns
ALTER TABLE public.transaction ADD COLUMN loan_id bigint;
ALTER TABLE public.transaction ADD COLUMN loan_payment_type varchar(20);

-- Foreign key constraints for transaction -> loan
ALTER TABLE public.transaction ADD CONSTRAINT fk_transaction_loan
    FOREIGN KEY (loan_id) REFERENCES public.loan(id) ON DELETE SET NULL;

-- Index for efficient transaction lookup by loan_id
CREATE INDEX idx_transaction_loan_id ON public.transaction(loan_id);

-- Alter public.loan to add default expense categorization columns
ALTER TABLE public.loan ADD COLUMN expense_category_id bigint;
ALTER TABLE public.loan ADD COLUMN expense_subcategory_id bigint;
ALTER TABLE public.loan ADD COLUMN expense_item_id bigint;

-- Foreign key constraints for loan -> category/subcategory/item
ALTER TABLE public.loan ADD CONSTRAINT fk_loan_expense_category
    FOREIGN KEY (expense_category_id) REFERENCES public.category(id) ON DELETE SET NULL;

ALTER TABLE public.loan ADD CONSTRAINT fk_loan_expense_subcategory
    FOREIGN KEY (expense_subcategory_id) REFERENCES public.sub_category(id) ON DELETE SET NULL;

ALTER TABLE public.loan ADD CONSTRAINT fk_loan_expense_item
    FOREIGN KEY (expense_item_id) REFERENCES public.item(id) ON DELETE SET NULL;
