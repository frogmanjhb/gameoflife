CREATE TABLE IF NOT EXISTS police_fine_bonus_requests (
  id                SERIAL PRIMARY KEY,
  submitted_by_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              VARCHAR(10) NOT NULL CHECK (type IN ('fine', 'bonus')),
  amount            NUMERIC(12,2) NOT NULL,
  description       TEXT,
  teacher_initials  VARCHAR(10) NOT NULL,
  status            VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  school_id         INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  class             VARCHAR(20),
  reviewed_by_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pfbr_status       ON police_fine_bonus_requests(status);
CREATE INDEX IF NOT EXISTS idx_pfbr_school_id    ON police_fine_bonus_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_pfbr_submitted_by ON police_fine_bonus_requests(submitted_by_id);
