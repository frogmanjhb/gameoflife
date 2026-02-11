-- Migration: Pending Transfers (Teacher Approval)
-- Description: Student-to-student transfers require teacher approval
-- Date: 2025-02-11

CREATE TABLE IF NOT EXISTS pending_transfers (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_transfers_from_user ON pending_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_to_user ON pending_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_status ON pending_transfers(status);
