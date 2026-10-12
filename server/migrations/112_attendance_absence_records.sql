-- Immutable audit log for students marked absent on the daily register (who marked them and when).
CREATE TABLE IF NOT EXISTS attendance_absence_records (
    id SERIAL PRIMARY KEY,
    register_id INTEGER NOT NULL REFERENCES attendance_registers(id) ON DELETE CASCADE,
    register_entry_id INTEGER NOT NULL UNIQUE REFERENCES attendance_register_entries(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marked_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitter_role VARCHAR(10) NOT NULL CHECK (submitter_role IN ('nurse', 'doctor')),
    marked_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_absence_records_school_class_marked
    ON attendance_absence_records(school_id, town_class, marked_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_absence_records_doctor_marked
    ON attendance_absence_records(submitter_role, marked_at DESC)
    WHERE submitter_role = 'doctor';

CREATE INDEX IF NOT EXISTS idx_attendance_absence_records_marked_by
    ON attendance_absence_records(marked_by_user_id, marked_at DESC);

-- Backfill from existing absent register entries (submitter role from submitter's job at migration time).
INSERT INTO attendance_absence_records (
    register_id,
    register_entry_id,
    school_id,
    town_class,
    student_user_id,
    marked_by_user_id,
    submitter_role,
    marked_at
)
SELECT
    r.id,
    e.id,
    r.school_id,
    r.town_class,
    e.student_user_id,
    r.submitted_by_user_id,
    CASE
        WHEN LOWER(COALESCE(j.name, '')) LIKE '%nurse%' THEN 'nurse'
        WHEN LOWER(COALESCE(j.name, '')) LIKE '%doctor%' THEN 'doctor'
    END,
    r.submitted_at
FROM attendance_register_entries e
JOIN attendance_registers r ON r.id = e.register_id
JOIN users u ON u.id = r.submitted_by_user_id
LEFT JOIN jobs j ON u.job_id = j.id
WHERE e.status = 'absent'
  AND (
    LOWER(COALESCE(j.name, '')) LIKE '%nurse%'
    OR LOWER(COALESCE(j.name, '')) LIKE '%doctor%'
  )
ON CONFLICT (register_entry_id) DO NOTHING;
