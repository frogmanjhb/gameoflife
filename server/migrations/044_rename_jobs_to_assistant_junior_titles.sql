-- Migration: Rename jobs to Assistant/Junior entry-level titles
-- Description: Update job names for employment board; Mayor unchanged (elected).
-- Date: 2025-02-21

-- Government & Finance (Mayor stays as is)
UPDATE jobs SET name = 'Assistant Financial Manager' WHERE name = 'Financial Manager';
UPDATE jobs SET name = 'Junior Chartered Accountant' WHERE name = 'Chartered Accountant';
UPDATE jobs SET name = 'Assistant HR Director' WHERE name = 'HR Director';
UPDATE jobs SET name = 'Junior Police Lieutenant' WHERE name = 'Police Lieutenant';
UPDATE jobs SET name = 'Junior Lawyer' WHERE name = 'Lawyer';
UPDATE jobs SET name = 'Assistant Town Planner' WHERE name = 'Town Planner';

-- Infrastructure & Design
UPDATE jobs SET name = 'Assistant Civil Engineer' WHERE name = 'Civil Engineer';
UPDATE jobs SET name = 'Assistant Electrical Engineer' WHERE name = 'Electrical Engineer';
UPDATE jobs SET name = 'Assistant Architect' WHERE name = 'Architect';

-- Education
UPDATE jobs SET name = 'Assistant Principal' WHERE name = 'School Principal';
UPDATE jobs SET name = 'Assistant Teacher' WHERE name = 'Teacher';

-- Health
UPDATE jobs SET name = 'Junior Doctor' WHERE name = 'Doctor';
UPDATE jobs SET name = 'Assistant Nurse' WHERE name = 'Nurse';

-- Economy & Events
UPDATE jobs SET name = 'Assistant Retail Manager' WHERE name = 'Retail Manager';
UPDATE jobs SET name = 'Assistant Event Planner' WHERE name = 'Event Planner';

-- Media & Tech
UPDATE jobs SET name = 'Assistant Marketing Manager' WHERE name = 'Marketing Manager';
UPDATE jobs SET name = 'Assistant Graphic Designer' WHERE name = 'Graphic Designer';
UPDATE jobs SET name = 'Assistant Journalist' WHERE name = 'Journalist';
UPDATE jobs SET name = 'Assistant Software Engineer' WHERE name = 'Software Engineer';
