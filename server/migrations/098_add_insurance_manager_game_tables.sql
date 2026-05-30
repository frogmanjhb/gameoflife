-- Migration: Add Insurance Manager (Risk Review) Game Tables
-- Description: Challenge game for Assistant Risk & Insurance Manager job

CREATE TABLE IF NOT EXISTS insurance_manager_game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    score INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_problems INTEGER NOT NULL DEFAULT 0,
    experience_points INTEGER NOT NULL DEFAULT 0,
    earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insurance_manager_game_high_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    high_score INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_insurance_manager_game_sessions_user_id ON insurance_manager_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_manager_game_sessions_played_at ON insurance_manager_game_sessions(played_at);
CREATE INDEX IF NOT EXISTS idx_insurance_manager_game_high_scores_user_id ON insurance_manager_game_high_scores(user_id);
