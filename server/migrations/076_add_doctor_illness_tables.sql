-- Migration: Doctor illness assignments (random class illnesses, 5/day per town class)
CREATE TABLE IF NOT EXISTS doctor_illness_assignments (
    id SERIAL PRIMARY KEY,
    patient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    illness_type VARCHAR(32) NOT NULL CHECK (illness_type IN ('verdigris_vertigo', 'button_lock_fever', 'creep_crawlies')),
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cured_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_illness_patient_active
    ON doctor_illness_assignments(patient_user_id) WHERE cured_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_illness_class_day
    ON doctor_illness_assignments(school_id, town_class, assigned_at);
