-- Create loan table
CREATE TABLE public.loan (
    id bigint NOT NULL,
    name varchar(255) NOT NULL,
    lender varchar(255),
    principal_amount double precision NOT NULL,
    annual_rate double precision NOT NULL,
    tenure_months integer NOT NULL,
    start_date date NOT NULL,
    emi_amount double precision NOT NULL,
    emis_paid integer DEFAULT 0 NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    closed_at timestamp with time zone,
    notes text,
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_pkey PRIMARY KEY (id),
    CONSTRAINT loan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Create sequence for loan
CREATE SEQUENCE public.loan_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create index on user_id
CREATE INDEX idx_loan_user_id ON public.loan(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.loan ENABLE ROW LEVEL SECURITY;
