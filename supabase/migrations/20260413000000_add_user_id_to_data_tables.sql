-- ── Step 1: Add nullable user_id columns ──────────────────────────────────────
ALTER TABLE public.transaction ADD COLUMN user_id bigint;
ALTER TABLE public.category   ADD COLUMN user_id bigint;
ALTER TABLE public.budget     ADD COLUMN user_id bigint;

-- ── Step 2: Backfill existing rows to the only existing user ──────────────────
UPDATE public.transaction SET user_id = (SELECT id FROM public.app_user LIMIT 1) WHERE user_id IS NULL;
UPDATE public.category    SET user_id = (SELECT id FROM public.app_user LIMIT 1) WHERE user_id IS NULL;
UPDATE public.budget      SET user_id = (SELECT id FROM public.app_user LIMIT 1) WHERE user_id IS NULL;

-- ── Step 3: NOT NULL + FK constraints ─────────────────────────────────────────
ALTER TABLE public.transaction ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.category    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budget      ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.transaction
    ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;
ALTER TABLE public.category
    ADD CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;
ALTER TABLE public.budget
    ADD CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;

-- ── Step 4: Replace old global-unique budget indexes with per-user ones ────────
DROP INDEX IF EXISTS public.budget_master_unique;
DROP INDEX IF EXISTS public.budget_month_year_unique;

-- One master budget per user
CREATE UNIQUE INDEX budget_user_master_unique
    ON public.budget (user_id)
    WHERE is_master = true;

-- One budget per (user, month, year)
CREATE UNIQUE INDEX budget_user_month_year_unique
    ON public.budget (user_id, month, year)
    WHERE is_master = false;
