-- Migration: Remove duplicate Software Engineer job
-- Description: Seed was inserting both "Assistant Software Engineer" (main list) and "Software Engineer"
--   (legacy block), causing two cards; the old "Software Engineer" row could show R4,000. Keep only
--   "Assistant Software Engineer" and normalize any remaining base_salary 4000 to 2000.
-- Date: 2025-02-21

-- Reassign users who are assigned to "Software Engineer" to "Assistant Software Engineer" (same role)
UPDATE users u
SET job_id = (
  SELECT j2.id FROM jobs j2
  WHERE j2.name = 'Assistant Software Engineer'
    AND (j2.school_id IS NOT DISTINCT FROM (SELECT j1.school_id FROM jobs j1 WHERE j1.id = u.job_id LIMIT 1))
  LIMIT 1
)
WHERE u.job_id IN (SELECT id FROM jobs WHERE name = 'Software Engineer');

-- Remove the duplicate "Software Engineer" job row(s)
DELETE FROM jobs WHERE name = 'Software Engineer';

-- Ensure no job still has base_salary 4000 (legacy default)
UPDATE jobs SET base_salary = 2000.00 WHERE base_salary = 4000.00 OR base_salary IS NULL;
