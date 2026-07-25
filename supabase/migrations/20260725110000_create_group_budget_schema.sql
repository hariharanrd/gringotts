CREATE SEQUENCE IF NOT EXISTS group_budget_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS group_budget_category_allocation_seq START 1 INCREMENT 1;

CREATE TABLE public.group_budget (
    id                BIGINT           PRIMARY KEY DEFAULT nextval('group_budget_seq'),
    group_id          BIGINT           NOT NULL REFERENCES public.transaction_group(id) ON DELETE CASCADE,
    user_id           BIGINT           NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
    name              VARCHAR(255)     NOT NULL,
    budget_type       VARCHAR(50)      NOT NULL DEFAULT 'OVERALL', -- OVERALL, RECURRING_MONTHLY
    month             INT,             -- NULL for overall budget or base recurring budget
    year              INT,             -- NULL for overall budget or base recurring budget
    total_amount      DOUBLE PRECISION NOT NULL,
    notes             TEXT,
    created_at        TIMESTAMP        NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX group_budget_unique
    ON public.group_budget (group_id, COALESCE(month, -1), COALESCE(year, -1));

CREATE TABLE public.group_budget_category_allocation (
    id                BIGINT           PRIMARY KEY DEFAULT nextval('group_budget_category_allocation_seq'),
    group_budget_id   BIGINT           NOT NULL REFERENCES public.group_budget(id) ON DELETE CASCADE,
    group_category_id BIGINT           NOT NULL REFERENCES public.group_category(id) ON DELETE RESTRICT,
    allocated_amount  DOUBLE PRECISION NOT NULL,
    UNIQUE (group_budget_id, group_category_id)
);
