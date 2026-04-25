-- Migration: create scheduled_transaction table and add schedule fields to transaction

-- Create sequence for scheduled_transaction IDs
CREATE SEQUENCE IF NOT EXISTS public.scheduled_transaction_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create scheduled_transaction table
CREATE TABLE IF NOT EXISTS public.scheduled_transaction (
    id bigint PRIMARY KEY DEFAULT nextval('public.scheduled_transaction_seq'),
    name varchar NOT NULL,
    transaction_type varchar NOT NULL,
    amount double precision NOT NULL,
    description text,
    category bigint,
    subcategory bigint,
    item bigint,
    payment_mode varchar,
    is_in boolean,
    frequency varchar NOT NULL,
    start_date date NOT NULL,
    end_date date,
    next_run_date date,
    last_run_date date,
    is_active boolean DEFAULT true,
    user_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);

-- Foreign keys
ALTER TABLE public.scheduled_transaction
  ADD CONSTRAINT fk_scheduled_transaction_user FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;

ALTER TABLE public.scheduled_transaction
  ADD CONSTRAINT fk_scheduled_transaction_category FOREIGN KEY (category) REFERENCES public.category(id) ON DELETE SET NULL;

ALTER TABLE public.scheduled_transaction
  ADD CONSTRAINT fk_scheduled_transaction_subcategory FOREIGN KEY (subcategory) REFERENCES public.sub_category(id) ON DELETE SET NULL;

ALTER TABLE public.scheduled_transaction
  ADD CONSTRAINT fk_scheduled_transaction_item FOREIGN KEY (item) REFERENCES public.item(id) ON DELETE SET NULL;

-- Index to quickly find due schedules
CREATE INDEX IF NOT EXISTS idx_scheduled_transaction_next_run_date ON public.scheduled_transaction(next_run_date);

-- Add columns to transaction table
ALTER TABLE public.transaction
  ADD COLUMN IF NOT EXISTS created_by varchar DEFAULT 'USER';

ALTER TABLE public.transaction
  ADD COLUMN IF NOT EXISTS schedule_id bigint;

-- Foreign key from transaction.schedule_id to scheduled_transaction.id
ALTER TABLE public.transaction
  ADD CONSTRAINT fk_transaction_schedule FOREIGN KEY (schedule_id) REFERENCES public.scheduled_transaction(id) ON DELETE SET NULL;

-- Optional index on transaction.schedule_id
CREATE INDEX IF NOT EXISTS idx_transaction_schedule_id ON public.transaction(schedule_id);

-- End of migration
