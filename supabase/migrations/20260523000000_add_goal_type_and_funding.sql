-- Migration to add goal_type to investment_goal and funding_goal_id to transaction

-- 1. Add goal_type to investment_goal with default 'PERSISTENT'
ALTER TABLE public.investment_goal
ADD COLUMN goal_type VARCHAR(20) NOT NULL DEFAULT 'PERSISTENT';

-- 2. Add funding_goal_id to transaction
ALTER TABLE public.transaction
ADD COLUMN funding_goal_id BIGINT,
ADD CONSTRAINT fk_transaction_funding_goal
    FOREIGN KEY (funding_goal_id)
    REFERENCES public.investment_goal(id)
    ON DELETE SET NULL;

-- 3. Create index for performance
CREATE INDEX idx_transaction_funding_goal ON public.transaction(funding_goal_id);
