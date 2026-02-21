-- Migration: Add Business Proposals (Entrepreneur job)
-- Description: Entrepreneurs submit business ideas for teacher approval before starting.
-- Date: 2025-02-21

CREATE TABLE IF NOT EXISTS business_proposals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    business_name VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    denial_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_business_proposals_user_id ON business_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_business_proposals_school_id ON business_proposals(school_id);
CREATE INDEX IF NOT EXISTS idx_business_proposals_status ON business_proposals(status);
CREATE INDEX IF NOT EXISTS idx_business_proposals_created_at ON business_proposals(created_at);
