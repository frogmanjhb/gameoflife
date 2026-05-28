-- Migration: Lawyer review step for police fines/bonuses
ALTER TABLE police_fine_bonus_requests
    ALTER COLUMN status TYPE VARCHAR(24);

ALTER TABLE police_fine_bonus_requests
    DROP CONSTRAINT IF EXISTS police_fine_bonus_requests_status_check;

ALTER TABLE police_fine_bonus_requests
    ADD COLUMN IF NOT EXISTS lawyer_reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lawyer_reviewed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS lawyer_notes TEXT,
    ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
    ADD COLUMN IF NOT EXISTS police_evidence_response TEXT,
    ADD COLUMN IF NOT EXISTS lawyer_disputed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS police_evidence_at TIMESTAMP;

UPDATE police_fine_bonus_requests SET status = 'pending_teacher' WHERE status = 'pending';

ALTER TABLE police_fine_bonus_requests
    ADD CONSTRAINT police_fine_bonus_requests_status_check
    CHECK (status IN ('pending_lawyer', 'disputed', 'pending_teacher', 'approved', 'denied'));
