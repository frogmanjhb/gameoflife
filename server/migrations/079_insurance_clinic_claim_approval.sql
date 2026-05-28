-- Migration: Insurance manager approval for clinic claims + broker earnings tracking

ALTER TABLE doctor_illness_assignments
  ADD COLUMN IF NOT EXISTS insurance_claim_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS insurance_claim_reviewed_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS insurance_claim_reviewed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_doctor_illness_pending_insurance_claim
  ON doctor_illness_assignments(town_class, school_id)
  WHERE insurance_claim_requested_at IS NOT NULL
    AND cure_requested_at IS NULL
    AND cured_at IS NULL;
