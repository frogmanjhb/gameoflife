-- Migration: Widen status column for lawyer workflow states
ALTER TABLE police_fine_bonus_requests
    ALTER COLUMN status TYPE VARCHAR(24);

ALTER TABLE police_fine_bonus_requests
    DROP CONSTRAINT IF EXISTS police_fine_bonus_requests_status_check;

ALTER TABLE police_fine_bonus_requests
    ADD CONSTRAINT police_fine_bonus_requests_status_check
    CHECK (status IN ('pending_lawyer', 'disputed', 'pending_teacher', 'approved', 'denied'));

UPDATE police_fine_bonus_requests SET status = 'pending_teacher' WHERE status = 'pending';
