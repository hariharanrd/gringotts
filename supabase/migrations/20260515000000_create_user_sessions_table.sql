CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);
