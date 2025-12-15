-- Migration: Add weekly loan payment support
-- This migration adds columns to support weekly loan payments based on job salary

-- Add weekly_payment column to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS weekly_payment DECIMAL(10,2);

-- Add term_weeks column to loans table (replacing term_months for new loans)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS term_weeks INTEGER;

-- Add next_payment_date to track when the next payment is due
ALTER TABLE loans ADD COLUMN IF NOT EXISTS next_payment_date DATE;

-- Add last_payment_date to track when the last payment was made
ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_payment_date DATE;

-- Add job_id that was used when loan was approved (for audit purposes)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS job_id_at_approval INTEGER;

-- Add salary_at_approval to track the salary used for loan calculation
ALTER TABLE loans ADD COLUMN IF NOT EXISTS salary_at_approval DECIMAL(10,2);

-- Create index for payment processing
CREATE INDEX IF NOT EXISTS idx_loans_next_payment_date ON loans(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_loans_status_payment ON loans(status, next_payment_date);

-- Update existing active loans to have weekly payment calculated from monthly
-- (existing loans will continue with their current setup until paid off)
UPDATE loans 
SET weekly_payment = ROUND(monthly_payment / 4.33, 2)
WHERE weekly_payment IS NULL AND status = 'active';

