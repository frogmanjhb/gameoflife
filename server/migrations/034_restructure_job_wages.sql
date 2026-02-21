-- Migration: Restructure Job Wages System
-- Description: All jobs start at R4000, progression-based increases, contractual jobs
-- Date: 2025-02-20

-- Add base_salary to jobs table (default R2000 for all jobs)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 2000.00;

-- Add is_contractual flag to jobs table (contractual jobs earn more)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_contractual BOOLEAN DEFAULT false;

-- Update existing jobs to have base_salary of R2000
-- Update jobs with NULL, 0, or the old default of 4000
UPDATE jobs SET base_salary = 2000.00 WHERE base_salary IS NULL OR base_salary = 0 OR base_salary = 4000.00;

-- Add job_level to users table to track progression (1 = entry level, increases with performance)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_level INTEGER DEFAULT 1 CHECK (job_level >= 1 AND job_level <= 10);

-- Add job_experience_points to users table to track performance
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_experience_points INTEGER DEFAULT 0 CHECK (job_experience_points >= 0);

-- Add job_started_at to users table to track when they started their current job
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_started_at TIMESTAMP;

-- Create index for job level queries
CREATE INDEX IF NOT EXISTS idx_users_job_level ON users(job_level);
CREATE INDEX IF NOT EXISTS idx_users_job_experience_points ON users(job_experience_points);

-- Note: The old salary column will remain for backward compatibility but will be calculated dynamically
-- Salary calculation: base_salary * (1 + (job_level - 1) * 0.7222) * (is_contractual ? 1.5 : 1.0)
-- Level 1: 100% of base (R2000)
-- Level 2: ~172% of base (R3,444)
-- Level 3: ~245% of base (R4,889)
-- ... up to Level 10: 750% of base (R15,000)
-- Contractual jobs get 1.5x multiplier on top of level-based salary (Level 10 contractual: R22,500)
