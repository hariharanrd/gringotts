-- Add confirmed column to app_user
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE;

-- Mark existing users as confirmed to avoid locking them out
UPDATE app_user SET confirmed = TRUE WHERE confirmed IS FALSE;
