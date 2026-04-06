CREATE SEQUENCE IF NOT EXISTS budget_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS budget_category_allocation_seq START 1 INCREMENT 1;

CREATE TABLE public.budget (
                               id                BIGINT           PRIMARY KEY DEFAULT nextval('budget_seq'),
                               name              VARCHAR(255)     NOT NULL,
                               month             INT,                          -- NULL for master budget
                               year              INT,                          -- NULL for master budget
                               is_master         BOOLEAN          NOT NULL DEFAULT false,
                               total_amount      DOUBLE PRECISION NOT NULL,
                               estimated_savings DOUBLE PRECISION NOT NULL DEFAULT 0,
                               notes             TEXT,
                               created_at        TIMESTAMP        NOT NULL DEFAULT now()
);

-- Only one budget allowed per (month, year) pair; master is exempt
CREATE UNIQUE INDEX budget_month_year_unique
    ON public.budget (month, year)
    WHERE is_master = false;

CREATE TABLE public.budget_category_allocation (
                                                   id               BIGINT           PRIMARY KEY DEFAULT nextval('budget_category_allocation_seq'),
                                                   budget_id        BIGINT           NOT NULL REFERENCES public.budget(id) ON DELETE CASCADE,
                                                   category_id      BIGINT           NOT NULL REFERENCES public.category(id) ON DELETE RESTRICT,
                                                   allocated_amount DOUBLE PRECISION NOT NULL,
                                                   UNIQUE (budget_id, category_id)
);