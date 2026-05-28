-- Daily attendance register + sick note workflow
CREATE TABLE IF NOT EXISTS attendance_registers (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    submitted_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_register_entries (
    id SERIAL PRIMARY KEY,
    register_id INTEGER NOT NULL REFERENCES attendance_registers(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
    UNIQUE (register_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS sick_notes (
    id SERIAL PRIMARY KEY,
    register_entry_id INTEGER NOT NULL UNIQUE REFERENCES attendance_register_entries(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewer_role VARCHAR(20) NOT NULL DEFAULT 'none'
        CHECK (reviewer_role IN ('hr_director', 'financial_manager', 'lawyer', 'none')),
    explanation TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'awaiting_submission'
        CHECK (status IN ('awaiting_submission', 'pending_review', 'approved', 'denied')),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_registers_class_day
    ON attendance_registers(school_id, town_class, submitted_at);

CREATE INDEX IF NOT EXISTS idx_sick_notes_student_status
    ON sick_notes(student_user_id, status);

CREATE INDEX IF NOT EXISTS idx_sick_notes_reviewer_pending
    ON sick_notes(reviewer_user_id, status)
    WHERE status = 'pending_review';
