-- Migration: Auto-approve insurance purchases stuck in pending_broker when the
-- purchaser is the town's only insurance manager (cannot self-approve).

UPDATE insurance_purchases ip
SET status = 'approved',
    week_start_date = COALESCE(ip.week_start_date, CURRENT_DATE)
WHERE ip.status = 'pending_broker'
  AND EXISTS (
    SELECT 1
    FROM users u
    JOIN jobs j ON j.id = u.job_id
    WHERE u.id = ip.user_id
      AND u.role = 'student'
      AND LOWER(j.name) LIKE '%insurance%'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM users u2
    JOIN jobs j2 ON j2.id = u2.job_id
    WHERE u2.role = 'student'
      AND u2.status = 'approved'
      AND u2.class = ip.town_class
      AND u2.school_id IS NOT DISTINCT FROM ip.school_id
      AND LOWER(j2.name) LIKE '%insurance%'
      AND u2.id <> ip.user_id
  );
