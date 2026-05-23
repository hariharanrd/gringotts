-- Migration to add funding_goal_id to scheduled_transaction table

ALTER TABLE public.scheduled_transaction
ADD COLUMN funding_goal_id BIGINT,
ADD CONSTRAINT fk_scheduled_transaction_funding_goal
    FOREIGN KEY (funding_goal_id)
    REFERENCES public.investment_goal(id)
    ON DELETE RESTRICT;

CREATE INDEX idx_scheduled_transaction_funding_goal ON public.scheduled_transaction(funding_goal_id);
