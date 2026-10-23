-- Add index on user_id and created_at DESC for efficient sorting by created time
CREATE INDEX IF NOT EXISTS idx_transaction_user_created_at ON public.transaction (user_id, created_at DESC);
