-- Migration to update the foreign key constraint on transaction.funding_goal_id to ON DELETE RESTRICT

ALTER TABLE public.transaction
DROP CONSTRAINT IF EXISTS fk_transaction_funding_goal;

ALTER TABLE public.transaction
ADD CONSTRAINT fk_transaction_funding_goal
    FOREIGN KEY (funding_goal_id)
    REFERENCES public.investment_goal(id)
    ON DELETE RESTRICT;
