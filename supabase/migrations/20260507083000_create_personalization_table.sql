CREATE TABLE IF NOT EXISTS public.personalization (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    UNIQUE (user_id, category, "key")
);

CREATE INDEX IF NOT EXISTS idx_personalization_user_category ON public.personalization(user_id, category);
