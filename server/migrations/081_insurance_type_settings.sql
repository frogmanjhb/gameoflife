-- Migration: Per-school insurance type enable/disable (teacher-controlled)

CREATE TABLE IF NOT EXISTS insurance_disabled_types (
    school_id INTEGER NOT NULL,
    insurance_type VARCHAR(20) NOT NULL CHECK (insurance_type IN ('health', 'cyber', 'property')),
    disabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disabled_by INTEGER REFERENCES users(id),
    PRIMARY KEY (school_id, insurance_type)
);

CREATE INDEX IF NOT EXISTS idx_insurance_disabled_types_school
  ON insurance_disabled_types(school_id);
