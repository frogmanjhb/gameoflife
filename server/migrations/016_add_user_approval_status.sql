-- Migration: Add User Approval Status
-- Description: Add status field to users table to track pending/approved students
-- Date: 2025-01-23

-- Add status column to users table
-- 'approved' for existing users and teachers (default)
-- 'pending' for new student registrations that need teacher approval
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' 
CHECK (status IN ('pending', 'approved', 'denied'));

-- Set all existing users to approved status
UPDATE users SET status = 'approved' WHERE status IS NULL;

-- Set default to 'approved' for teachers, 'pending' for new students
-- This will be handled in application code, but we ensure existing data is correct
UPDATE users SET status = 'approved' WHERE role = 'teacher';

-- Create index for faster queries on pending students
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
