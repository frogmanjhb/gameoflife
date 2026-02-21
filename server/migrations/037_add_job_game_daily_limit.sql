-- Migration: Add job game daily limit to town_settings
-- Description: Allow teachers to set per-town daily limit for job challenge games (Architect, Chartered Accountant)
-- Date: 2025-02-20

ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS job_game_daily_limit INTEGER DEFAULT 3;

-- Constrain to reasonable range (0 = disabled, max 50)
ALTER TABLE town_settings DROP CONSTRAINT IF EXISTS town_settings_job_game_daily_limit_check;
ALTER TABLE town_settings ADD CONSTRAINT town_settings_job_game_daily_limit_check
  CHECK (job_game_daily_limit >= 0 AND job_game_daily_limit <= 50);
