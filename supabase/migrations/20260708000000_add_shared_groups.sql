-- Add shared flag to transaction_group
ALTER TABLE public.transaction_group ADD COLUMN shared boolean NOT NULL DEFAULT false;

-- Create sequence for group_member
CREATE SEQUENCE public.group_member_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE public.group_member (
    id bigint NOT NULL DEFAULT nextval('public.group_member_seq'),
    group_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'MEMBER',      -- ADMIN, MEMBER
    status varchar(50) NOT NULL DEFAULT 'PENDING',    -- PENDING, ACCEPTED, DECLINED, REMOVED, LEFT
    invited_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    invited_by_user_id bigint NOT NULL,
    CONSTRAINT group_member_pkey PRIMARY KEY (id),
    CONSTRAINT group_member_group_fkey FOREIGN KEY (group_id) REFERENCES public.transaction_group(id) ON DELETE CASCADE,
    CONSTRAINT group_member_user_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE,
    CONSTRAINT group_member_invited_by_fkey FOREIGN KEY (invited_by_user_id) REFERENCES public.app_user(id) ON DELETE CASCADE,
    CONSTRAINT group_member_group_user_unique UNIQUE (group_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.group_member ENABLE ROW LEVEL SECURITY;
