-- Land purchase: Financial Manager review step before engineer approvals

ALTER TABLE land_purchase_requests DROP CONSTRAINT IF EXISTS land_purchase_requests_status_check;

UPDATE land_purchase_requests
SET status = 'pending_fm'
WHERE status = 'pending_engineer';

ALTER TABLE land_purchase_requests
ADD CONSTRAINT land_purchase_requests_status_check
CHECK (status IN ('pending_fm', 'pending_engineer', 'pending_teacher', 'approved', 'denied'));

ALTER TABLE land_purchase_requests
  ADD COLUMN IF NOT EXISTS fm_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fm_reviewed_at TIMESTAMP;

DROP INDEX IF EXISTS idx_land_purchase_one_active;

CREATE UNIQUE INDEX IF NOT EXISTS idx_land_purchase_one_active
  ON land_purchase_requests(user_id, parcel_id)
  WHERE status IN ('pending_fm', 'pending_engineer', 'pending_teacher');
