-- Create password_reset_token table
CREATE TABLE public.password_reset_token (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token varchar(255) NOT NULL UNIQUE,
    expiry_date timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT password_reset_token_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Create sequence for password_reset_token
CREATE SEQUENCE public.password_reset_token_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create index for password_reset_token
CREATE INDEX idx_password_reset_token_user_id ON public.password_reset_token(user_id);
CREATE INDEX idx_password_reset_token_token ON public.password_reset_token(token);

-- Enable RLS for password_reset_token
ALTER TABLE public.password_reset_token ENABLE ROW LEVEL SECURITY;

-- Create user_recovery_info table
CREATE TABLE public.user_recovery_info (
    id bigint NOT NULL,
    user_id bigint NOT NULL UNIQUE,
    recovery_email varchar(255),
    verification_status varchar(50) DEFAULT 'PENDING' NOT NULL,
    otp varchar(255),
    expiry timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_recovery_info_pkey PRIMARY KEY (id),
    CONSTRAINT user_recovery_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Create sequence for user_recovery_info
CREATE SEQUENCE public.user_recovery_info_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create index for user_recovery_info
CREATE INDEX idx_user_recovery_info_user_id ON public.user_recovery_info(user_id);
CREATE INDEX idx_user_recovery_info_recovery_email ON public.user_recovery_info(recovery_email);

-- Enable RLS for user_recovery_info
ALTER TABLE public.user_recovery_info ENABLE ROW LEVEL SECURITY;
