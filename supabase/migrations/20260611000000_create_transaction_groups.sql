-- Create sequence for transaction_group
CREATE SEQUENCE public.transaction_group_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create transaction_group table
CREATE TABLE public.transaction_group (
    id bigint NOT NULL,
    name varchar(255) NOT NULL,
    description text,
    type varchar(50) NOT NULL DEFAULT 'CUSTOM', -- TRIP, EVENT, PROJECT, PERSONAL, CUSTOM
    icon varchar(50), -- Lucide icon key
    color varchar(50), -- HSL or hex color
    status varchar(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transaction_group_pkey PRIMARY KEY (id),
    CONSTRAINT transaction_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transaction_group ENABLE ROW LEVEL SECURITY;

-- Alter transaction table to add group_id relation
ALTER TABLE public.transaction ADD COLUMN group_id bigint;

ALTER TABLE public.transaction ADD CONSTRAINT fk_transaction_group
    FOREIGN KEY (group_id) REFERENCES public.transaction_group(id) ON DELETE SET NULL;

CREATE INDEX idx_transaction_group_id ON public.transaction(group_id);
