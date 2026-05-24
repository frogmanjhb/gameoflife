-- Land purchase: Architect & Civil Engineer approval step before teacher review

ALTER TABLE land_purchase_requests DROP CONSTRAINT IF EXISTS land_purchase_requests_status_check;

UPDATE land_purchase_requests
SET status = 'pending_teacher'
WHERE status = 'pending';

ALTER TABLE land_purchase_requests
ADD CONSTRAINT land_purchase_requests_status_check
CHECK (status IN ('pending_engineer', 'pending_teacher', 'approved', 'denied'));

ALTER TABLE land_purchase_requests DROP CONSTRAINT IF EXISTS land_purchase_requests_user_id_parcel_id_status_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_land_purchase_one_active
  ON land_purchase_requests(user_id, parcel_id)
  WHERE status IN ('pending_engineer', 'pending_teacher');

CREATE TABLE IF NOT EXISTS land_purchase_engineer_approvals (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES land_purchase_requests(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_name VARCHAR(100) NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_land_purchase_engineer_request ON land_purchase_engineer_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_engineer_approver ON land_purchase_engineer_approvals(approver_id);
