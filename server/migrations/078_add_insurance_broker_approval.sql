-- Migration: Insurance broker approval + health claim tracking
-- When a town class has an Assistant Risk & Insurance Manager, purchases require broker approval.
-- Approved health insurance can pay clinic fees automatically.

ALTER TABLE insurance_purchases
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS denial_reason TEXT,
  ADD COLUMN IF NOT EXISTS town_class VARCHAR(5),
  ADD COLUMN IF NOT EXISTS school_id INTEGER;

ALTER TABLE insurance_purchases ALTER COLUMN week_start_date DROP NOT NULL;

UPDATE insurance_purchases SET status = 'approved' WHERE status IS NULL OR status = '';

UPDATE insurance_purchases ip
SET town_class = u.class, school_id = u.school_id
FROM users u
WHERE ip.user_id = u.id AND ip.town_class IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'insurance_purchases_status_check'
  ) THEN
    ALTER TABLE insurance_purchases
      ADD CONSTRAINT insurance_purchases_status_check
      CHECK (status IN ('pending_broker', 'approved', 'denied'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_insurance_purchases_status ON insurance_purchases(status);
CREATE INDEX IF NOT EXISTS idx_insurance_purchases_pending_broker
  ON insurance_purchases(town_class, school_id)
  WHERE status = 'pending_broker';

ALTER TABLE doctor_illness_assignments
  ADD COLUMN IF NOT EXISTS paid_by_insurance BOOLEAN NOT NULL DEFAULT false;
