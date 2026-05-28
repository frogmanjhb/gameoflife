-- Migration: Teacher approval for Town News stories and Code Board apps

ALTER TABLE town_news_stories
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'denied')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS denial_reason TEXT;

ALTER TABLE code_board_apps
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'denied')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Existing rows were published before approval existed; new submissions default to pending
ALTER TABLE town_news_stories ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE code_board_apps ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_town_news_stories_status ON town_news_stories(school_id, town_class, status);
CREATE INDEX IF NOT EXISTS idx_code_board_apps_status ON code_board_apps(school_id, town_class, status);
