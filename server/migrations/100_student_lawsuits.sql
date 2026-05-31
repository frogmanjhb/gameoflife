-- Student lawsuit / court system
CREATE TABLE IF NOT EXISTS student_lawsuits (
  id                          SERIAL PRIMARY KEY,
  school_id                   INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  town_class                  VARCHAR(20) NOT NULL,
  plaintiff_user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  defendant_user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_amount                NUMERIC(12,2) NOT NULL,
  awarded_amount              NUMERIC(12,2),
  description                 TEXT NOT NULL,
  rule_reference              TEXT NOT NULL,
  linked_action_type          VARCHAR(40),
  linked_action_id            INTEGER,
  status                      VARCHAR(30) NOT NULL DEFAULT 'pending_hr',
  defendant_response          TEXT,
  escrow_amount               NUMERIC(12,2),
  escrow_held_at              TIMESTAMP,
  escrow_refunded_at          TIMESTAMP,
  accepting_lawyer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  plaintiff_lawyer_acceptance VARCHAR(20) NOT NULL DEFAULT 'pending',
  plaintiff_lawyer_accepted_at TIMESTAMP,
  plaintiff_lawyer_declined_at TIMESTAMP,
  lawyer_fee_paid_at          TIMESTAMP,
  defendant_lawyer_fee_paid_at TIMESTAMP,
  hr_reviewer_id              INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hr_reviewed_at              TIMESTAMP,
  hr_notes                    TEXT,
  hr_outcome                  VARCHAR(30),
  hr_recommended_amount       NUMERIC(12,2),
  plaintiff_consents_settlement BOOLEAN DEFAULT FALSE,
  defendant_consents_settlement BOOLEAN DEFAULT FALSE,
  plaintiff_lawyer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  plaintiff_lawyer_opinion    VARCHAR(30),
  plaintiff_lawyer_notes      TEXT,
  plaintiff_lawyer_reviewed_at TIMESTAMP,
  defendant_lawyer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  defendant_lawyer_opinion    VARCHAR(30),
  defendant_lawyer_notes      TEXT,
  defendant_lawyer_reviewed_at TIMESTAMP,
  lawyer_conflict             BOOLEAN NOT NULL DEFAULT FALSE,
  jury_verdict                VARCHAR(20),
  jury_guilty_votes           INTEGER DEFAULT 0,
  jury_not_guilty_votes       INTEGER DEFAULT 0,
  jury_seated_at              TIMESTAMP,
  jury_completed_at           TIMESTAMP,
  jury_skipped_reason         VARCHAR(50),
  teacher_reviewer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  teacher_reviewed_at         TIMESTAMP,
  teacher_initials            VARCHAR(10),
  teacher_notes               TEXT,
  denial_reason               TEXT,
  created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_lawsuits_status_check CHECK (
    status IN (
      'pending_hr', 'pending_lawyer', 'pending_jury', 'pending_teacher',
      'approved', 'denied', 'withdrawn', 'resolved_mediation'
    )
  ),
  CONSTRAINT student_lawsuits_plaintiff_acceptance_check CHECK (
    plaintiff_lawyer_acceptance IN ('pending', 'accepted', 'declined', 'not_required')
  )
);

CREATE INDEX IF NOT EXISTS idx_student_lawsuits_status_school
  ON student_lawsuits(status, school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_student_lawsuits_plaintiff
  ON student_lawsuits(plaintiff_user_id);
CREATE INDEX IF NOT EXISTS idx_student_lawsuits_defendant
  ON student_lawsuits(defendant_user_id);

CREATE TABLE IF NOT EXISTS lawsuit_jury_assignments (
  id            SERIAL PRIMARY KEY,
  lawsuit_id    INTEGER NOT NULL REFERENCES student_lawsuits(id) ON DELETE CASCADE,
  juror_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote          VARCHAR(20),
  voted_at      TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lawsuit_jury_vote_check CHECK (vote IS NULL OR vote IN ('guilty', 'not_guilty')),
  CONSTRAINT lawsuit_jury_unique UNIQUE (lawsuit_id, juror_user_id)
);

CREATE INDEX IF NOT EXISTS idx_lawsuit_jury_lawsuit ON lawsuit_jury_assignments(lawsuit_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_jury_juror ON lawsuit_jury_assignments(juror_user_id);

-- Court plugin (disabled by default)
DO $$
DECLARE
  has_school_id_col BOOLEAN;
  plugin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugins' AND column_name = 'school_id'
  ) INTO has_school_id_col;

  IF has_school_id_col THEN
    SELECT EXISTS (
      SELECT 1 FROM plugins WHERE route_path = '/court' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins WHERE route_path = '/court'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Court', false, '/court', '⚖️', 'File lawsuits, jury trials, and civil disputes', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Court', false, '/court', '⚖️', 'File lawsuits, jury trials, and civil disputes');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
