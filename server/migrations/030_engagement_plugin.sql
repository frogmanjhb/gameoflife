-- Migration: Engagement tracking and plugin
-- Description: Add login_events table and Engagement plugin for teacher analytics
-- Date: 2026-02-12

-- Login events table (tracks student logins for engagement)
CREATE TABLE IF NOT EXISTS login_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_school_id ON login_events(school_id);
CREATE INDEX IF NOT EXISTS idx_login_events_logged_at ON login_events(logged_at);

-- Add Engagement plugin (teacher-only analytics)
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Engagement', true, '/engagement', '📊', 'Track student engagement: logins, chores, transfers, purchases')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
