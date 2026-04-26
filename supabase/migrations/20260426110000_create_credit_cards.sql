-- Create credit_card table
CREATE TABLE public.credit_card (
    id bigint NOT NULL,
    nickname varchar(100) NOT NULL,
    issuer varchar(100) NOT NULL,
    billing_date integer NOT NULL,
    due_date integer NOT NULL,
    credit_limit double precision NOT NULL,
    threshold_percentage integer DEFAULT 80 NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_card_pkey PRIMARY KEY (id),
    CONSTRAINT credit_card_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Create sequence for credit_card
CREATE SEQUENCE public.credit_card_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create credit_card_bill table
CREATE TABLE public.credit_card_bill (
    id bigint NOT NULL,
    credit_card_id bigint NOT NULL,
    billing_month integer NOT NULL,
    billing_year integer NOT NULL,
    amount_due double precision DEFAULT 0.0 NOT NULL,
    amount_paid double precision DEFAULT 0.0 NOT NULL,
    payment_status varchar(20) DEFAULT 'UNPAID' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_card_bill_pkey PRIMARY KEY (id),
    CONSTRAINT credit_card_bill_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(id) ON DELETE CASCADE
);

-- Create sequence for credit_card_bill
CREATE SEQUENCE public.credit_card_bill_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Add credit_card_id to expense table
ALTER TABLE public.expense 
ADD COLUMN credit_card_id bigint;

ALTER TABLE public.expense
ADD CONSTRAINT expense_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(id) ON DELETE SET NULL;
