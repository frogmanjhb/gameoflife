-- Migration: Teacher-managed Chartered Accountant client assignments per town class
CREATE TABLE IF NOT EXISTS accountant_student_assignments (
    id SERIAL PRIMARY KEY,
    accountant_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accountant_student_pair
    ON accountant_student_assignments (accountant_user_id, student_user_id);

CREATE INDEX IF NOT EXISTS idx_accountant_assignments_accountant
    ON accountant_student_assignments(accountant_user_id);
CREATE INDEX IF NOT EXISTS idx_accountant_assignments_class
    ON accountant_student_assignments(school_id, town_class);
