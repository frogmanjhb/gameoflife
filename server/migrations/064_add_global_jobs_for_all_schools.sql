-- Migration: Ensure global jobs exist for all schools
-- Description: For any job that only exists with a non-NULL school_id (school-scoped),
--   create a corresponding global job row (school_id IS NULL) so that every school
--   sees the same core job list (e.g. Entrepreneur – Town Business Founder).
-- Date: 2026-03-12

INSERT INTO jobs (name, description, salary, company_name, location, requirements, school_id, base_salary, is_contractual)
SELECT 
  j.name,
  j.description,
  j.salary,
  j.company_name,
  j.location,
  j.requirements,
  NULL AS school_id,
  j.base_salary,
  j.is_contractual
FROM jobs j
WHERE j.school_id IS NOT NULL
  -- Only create a global row when none exists yet for this job name
  AND NOT EXISTS (
    SELECT 1 FROM jobs j2 
    WHERE j2.name = j.name 
      AND j2.school_id IS NULL
  )
GROUP BY 
  j.name,
  j.description,
  j.salary,
  j.company_name,
  j.location,
  j.requirements,
  j.base_salary,
  j.is_contractual;

