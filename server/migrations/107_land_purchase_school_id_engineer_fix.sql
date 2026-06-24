-- Fix land purchase requests that skipped architect/engineer approval due to missing school_id

UPDATE land_purchase_requests lpr
SET school_id = u.school_id,
    updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE lpr.user_id = u.id
  AND lpr.school_id IS NULL
  AND u.school_id IS NOT NULL;

-- Re-queue purchases that reached teacher review without required engineer approvals
UPDATE land_purchase_requests lpr
SET status = 'pending_engineer',
    updated_at = CURRENT_TIMESTAMP
FROM users buyer,
     land_parcels lp
WHERE lpr.user_id = buyer.id
  AND lpr.parcel_id = lp.id
  AND lpr.status = 'pending_teacher'
  AND lpr.fm_reviewed_at IS NOT NULL
  AND lpr.reviewed_by IS NULL
  AND lp.town_class IN ('6A', '6B', '6C')
  AND EXISTS (
    SELECT 1
    FROM users arch
    JOIN jobs j ON j.id = arch.job_id
    WHERE arch.role = 'student'
      AND arch.class = lp.town_class
      AND arch.school_id IS NOT DISTINCT FROM COALESCE(lpr.school_id, buyer.school_id)
      AND arch.id <> lpr.user_id
      AND (
        LOWER(j.name) LIKE '%architect%'
        OR LOWER(j.name) LIKE '%civil engineer%'
      )
  )
  AND (
    SELECT COUNT(*)::int
    FROM land_purchase_engineer_approvals lpea
    WHERE lpea.request_id = lpr.id
  ) < (
    SELECT COUNT(*)::int
    FROM users arch
    JOIN jobs j ON j.id = arch.job_id
    WHERE arch.role = 'student'
      AND arch.class = lp.town_class
      AND arch.school_id IS NOT DISTINCT FROM COALESCE(lpr.school_id, buyer.school_id)
      AND arch.id <> lpr.user_id
      AND (
        LOWER(j.name) LIKE '%architect%'
        OR LOWER(j.name) LIKE '%civil engineer%'
      )
  );
