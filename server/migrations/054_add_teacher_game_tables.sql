-- Migration: Add Teacher (Learning Support) Game Tables
-- Description: Add tables for teacher job-specific learning support challenge game
-- Date: 2025-02-20

CREATE TABLE IF NOT EXISTS teacher_game_sessions (
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

CREATE TABLE IF NOT EXISTS teacher_game_high_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    high_score INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_teacher_game_sessions_user_id ON teacher_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_game_sessions_played_at ON teacher_game_sessions(played_at);
CREATE INDEX IF NOT EXISTS idx_teacher_game_high_scores_user_id ON teacher_game_high_scores(user_id);
