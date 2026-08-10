-- Add current_value and last_value_updated_at to investment_goal
-- current_value: the user-reported market value of the investment today
--   NULL = not separately tracked (falls back to current_amount behaviour)
-- last_value_updated_at: timestamp of the most recent manual market value update

ALTER TABLE investment_goal
  ADD COLUMN IF NOT EXISTS current_value DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_value_updated_at TIMESTAMP DEFAULT NULL;
