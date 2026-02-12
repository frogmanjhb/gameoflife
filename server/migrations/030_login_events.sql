-- Migration: Add login_events table for analytics
-- Description: Track user login events for engagement analytics
-- Date: 2025-02-12

CREATE TABLE IF NOT EXISTS login_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_school_id ON login_events(school_id);
CREATE INDEX IF NOT EXISTS idx_login_events_login_at ON login_events(login_at);
CREATE INDEX IF NOT EXISTS idx_login_events_user_login_at ON login_events(user_id, login_at);
