-- Migration: Secure Math Game with Server-Side Problem Generation
-- Description: Add columns to store server-generated problems and validate answers

-- Add started_at to track when session actually began
ALTER TABLE math_game_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add problems column to store server-generated problems (JSON array)
-- Each problem: { num1, num2, operation, answer, display }
ALTER TABLE math_game_sessions ADD COLUMN IF NOT EXISTS problems JSONB;

-- Add submitted flag to definitively prevent re-submission
ALTER TABLE math_game_sessions ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE;

-- Add current_problem_index to track progress (for real-time validation)
ALTER TABLE math_game_sessions ADD COLUMN IF NOT EXISTS current_problem_index INTEGER DEFAULT 0;

-- Add server_validated_score to store the actual validated score
ALTER TABLE math_game_sessions ADD COLUMN IF NOT EXISTS server_validated_score INTEGER DEFAULT 0;

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_math_game_sessions_submitted ON math_game_sessions(submitted);
