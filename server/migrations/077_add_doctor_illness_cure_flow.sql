-- Migration: Doctor illness cure payment + doctor approval flow
ALTER TABLE doctor_illness_assignments
  ADD COLUMN IF NOT EXISTS cure_fee NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS cure_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cure_paid_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_doctor_illness_pending_cure
  ON doctor_illness_assignments(assigned_by_user_id)
  WHERE cured_at IS NULL AND cure_requested_at IS NOT NULL;
