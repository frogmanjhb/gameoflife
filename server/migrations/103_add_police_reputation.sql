ALTER TABLE users
  ADD COLUMN IF NOT EXISTS police_reputation INTEGER NOT NULL DEFAULT 10;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS police_reputation_recovered_at TIMESTAMPTZ;

COMMENT ON COLUMN users.police_reputation IS 'Police Lieutenant town reputation (0–20, starts at 10).';
COMMENT ON COLUMN users.police_reputation_recovered_at IS 'Last civic day (04:00 boundary) when daily +1 reputation was applied.';
