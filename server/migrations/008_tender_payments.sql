-- Migration: Add tender payment tracking
-- Description: Track whether an awarded tender has been paid from treasury
-- Date: 2025-12-15

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenders_paid ON tenders(paid);


