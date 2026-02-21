-- Migration: Wordle game tables and chore enable toggles
-- Description: Add wordle_sessions for Wordle chores; add bank_settings for math_chores_enabled, wordle_chores_enabled, wordle_game_daily_limit

-- Wordle sessions table
CREATE TABLE IF NOT EXISTS wordle_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_word VARCHAR(5) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'won', 'lost')),
    guesses_count INTEGER NOT NULL DEFAULT 0,
    earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wordle_sessions_user_id ON wordle_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wordle_sessions_played_at ON wordle_sessions(played_at);

-- Chore toggles and wordle daily limit (insert only if missing)
INSERT INTO bank_settings (setting_key, setting_value, description)
VALUES
  ('math_chores_enabled', 'true', 'When true, students can play math chore challenges'),
  ('wordle_chores_enabled', 'true', 'When true, students can play Wordle chore challenges'),
  ('wordle_game_daily_limit', '3', 'Number of Wordle games each student can play per day')
ON CONFLICT (setting_key) DO NOTHING;
