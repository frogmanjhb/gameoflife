-- Migration: Allow multiple accountants per student (many-to-many)
ALTER TABLE accountant_student_assignments
    DROP CONSTRAINT IF EXISTS accountant_student_assignments_student_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accountant_student_pair
    ON accountant_student_assignments (accountant_user_id, student_user_id);
