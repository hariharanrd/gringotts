-- Investment Planner: investment_goal and investment_goal_tag tables

CREATE SEQUENCE IF NOT EXISTS public.investment_goal_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.investment_goal (
    id             bigint NOT NULL DEFAULT nextval('public.investment_goal_seq'),
    user_id        bigint NOT NULL,
    name           character varying(255) NOT NULL,
    icon           character varying(50)  NOT NULL DEFAULT '🎯',
    color          character varying(20)  NOT NULL DEFAULT '#6366f1',
    target_amount  double precision NOT NULL,
    current_amount double precision NOT NULL DEFAULT 0,
    monthly_contribution double precision NOT NULL DEFAULT 0,
    annual_rate    double precision NOT NULL DEFAULT 8,
    notes          text,
    created_at     timestamp(6) without time zone NOT NULL DEFAULT now(),
    CONSTRAINT investment_goal_pkey PRIMARY KEY (id),
    CONSTRAINT fk_investment_goal_user FOREIGN KEY (user_id)
        REFERENCES public.app_user(id) ON DELETE CASCADE
);

ALTER SEQUENCE public.investment_goal_seq OWNED BY public.investment_goal.id;

CREATE TABLE IF NOT EXISTS public.investment_goal_tag (
    id              bigserial PRIMARY KEY,
    goal_id         bigint NOT NULL,
    category_id     bigint,
    subcategory_id  bigint,
    item_id         bigint,
    CONSTRAINT fk_igt_goal FOREIGN KEY (goal_id)
        REFERENCES public.investment_goal(id) ON DELETE CASCADE,
    CONSTRAINT fk_igt_category FOREIGN KEY (category_id)
        REFERENCES public.category(id) ON DELETE CASCADE,
    CONSTRAINT fk_igt_subcategory FOREIGN KEY (subcategory_id)
        REFERENCES public.sub_category(id) ON DELETE CASCADE,
    CONSTRAINT fk_igt_item FOREIGN KEY (item_id)
        REFERENCES public.item(id) ON DELETE CASCADE,
    -- Ensure exactly one of category, subcategory, or item is set
    CONSTRAINT ck_igt_type CHECK (
        (category_id IS NOT NULL AND subcategory_id IS NULL AND item_id IS NULL) OR
        (category_id IS NULL AND subcategory_id IS NOT NULL AND item_id IS NULL) OR
        (category_id IS NULL AND subcategory_id IS NULL AND item_id IS NOT NULL)
    )
);

-- Permissions (match existing table grants)
GRANT ALL ON TABLE public.investment_goal TO anon;
GRANT ALL ON TABLE public.investment_goal TO authenticated;
GRANT ALL ON TABLE public.investment_goal TO service_role;

GRANT ALL ON SEQUENCE public.investment_goal_seq TO anon;
GRANT ALL ON SEQUENCE public.investment_goal_seq TO authenticated;
GRANT ALL ON SEQUENCE public.investment_goal_seq TO service_role;

GRANT ALL ON TABLE public.investment_goal_tag TO anon;
GRANT ALL ON TABLE public.investment_goal_tag TO authenticated;
GRANT ALL ON TABLE public.investment_goal_tag TO service_role;

ALTER TABLE public.investment_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_goal_tag ENABLE ROW LEVEL SECURITY;
