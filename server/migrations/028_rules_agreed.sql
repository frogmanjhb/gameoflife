-- Migration: Add rules_agreed_at to users
-- Description: Track when a student has signed/agreed to the app rules. Required for plugin access.
-- Date: 2025-02-11

ALTER TABLE users
ADD COLUMN IF NOT EXISTS rules_agreed_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_rules_agreed_at ON users(rules_agreed_at) WHERE rules_agreed_at IS NOT NULL;
