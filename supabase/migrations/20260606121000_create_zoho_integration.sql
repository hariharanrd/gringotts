-- Create zoho_integration table
CREATE TABLE public.zoho_integration (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    data_center VARCHAR(16) NOT NULL DEFAULT 'com',
    workspace_name VARCHAR(255) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    access_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_zoho_integration_user FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

ALTER TABLE public.zoho_integration ENABLE ROW LEVEL SECURITY;

