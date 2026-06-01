-- Doctor reputation: starts at 20, affects earnings when low.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS doctor_reputation INTEGER NOT NULL DEFAULT 20;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS doctor_reputation_recovered_at TIMESTAMPTZ;

COMMENT ON COLUMN users.doctor_reputation IS 'Junior Doctor town clinic reputation (0–20).';
COMMENT ON COLUMN users.doctor_reputation_recovered_at IS 'Last civic day (04:00 boundary) when daily +1 reputation was applied.';
