-- Migration: Add account_frozen to users
-- Description: Allow teachers to freeze a student's account. Frozen students see an overlay and cannot use the system.
-- Date: 2025-02-11

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_account_frozen ON users(account_frozen) WHERE account_frozen = true;
