-- Create loan_part_payment table
CREATE TABLE public.loan_part_payment (
    id bigint NOT NULL,
    loan_id bigint NOT NULL,
    amount double precision NOT NULL,
    payment_date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_part_payment_pkey PRIMARY KEY (id),
    CONSTRAINT loan_part_payment_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loan(id) ON DELETE CASCADE
);

-- Create sequence for loan_part_payment
CREATE SEQUENCE public.loan_part_payment_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create index on loan_id
CREATE INDEX idx_loan_part_payment_loan_id ON public.loan_part_payment(loan_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.loan_part_payment ENABLE ROW LEVEL SECURITY;
