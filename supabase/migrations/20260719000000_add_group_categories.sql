-- Create sequence for group_category
CREATE SEQUENCE public.group_category_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Group-specific flat category table (no subcategory/item hierarchy)
CREATE TABLE public.group_category (
    id         bigint NOT NULL DEFAULT nextval('public.group_category_seq'),
    group_id   bigint NOT NULL,
    user_id    bigint NOT NULL, -- Creator of the category
    name       varchar(255) NOT NULL,
    description text,
    icon       varchar(100),
    color      varchar(50),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT group_category_pkey PRIMARY KEY (id),
    CONSTRAINT group_category_group_fkey
        FOREIGN KEY (group_id) REFERENCES public.transaction_group(id) ON DELETE CASCADE,
    CONSTRAINT group_category_user_fkey
        FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE,
    CONSTRAINT group_category_name_group_unique UNIQUE (group_id, name)
);

ALTER TABLE group_category ENABLE ROW LEVEL SECURITY;

-- Add group_category reference to transactions
ALTER TABLE public.transaction
    ADD COLUMN group_category_id bigint,
    ADD CONSTRAINT transaction_group_category_fkey
        FOREIGN KEY (group_category_id) REFERENCES public.group_category(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_group_category_group_id ON public.group_category(group_id);
CREATE INDEX idx_transaction_group_category_id ON public.transaction(group_category_id);
