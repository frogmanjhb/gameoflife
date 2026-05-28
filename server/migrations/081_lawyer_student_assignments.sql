-- Migration: Teacher-managed Lawyer client assignments (many-to-many)
CREATE TABLE IF NOT EXISTS lawyer_student_assignments (
    id SERIAL PRIMARY KEY,
    lawyer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lawyer_student_pair
    ON lawyer_student_assignments (lawyer_user_id, student_user_id);

CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_lawyer
    ON lawyer_student_assignments(lawyer_user_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_class
    ON lawyer_student_assignments(school_id, town_class);
