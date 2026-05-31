-- Migration: Chartered Accountant weekly salary payments to assigned clients
CREATE TABLE IF NOT EXISTS accountant_salary_payments (
    id SERIAL PRIMARY KEY,
    accountant_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    week_start DATE NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    job_name VARCHAR(255),
    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One salary payment per student per town week (handles overlapping accountant assignments)
CREATE UNIQUE INDEX IF NOT EXISTS idx_accountant_salary_student_week
    ON accountant_salary_payments (student_user_id, town_class, week_start, (COALESCE(school_id, -1)));

CREATE INDEX IF NOT EXISTS idx_accountant_salary_accountant
    ON accountant_salary_payments (accountant_user_id, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_accountant_salary_week
    ON accountant_salary_payments (town_class, week_start, (COALESCE(school_id, -1)));
