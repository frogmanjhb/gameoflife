-- Add 'extreme' difficulty level (Car wash - 2x multiplier, 1-1000, x÷ up to 99)
ALTER TABLE math_game_sessions DROP CONSTRAINT IF EXISTS math_game_sessions_difficulty_check;
ALTER TABLE math_game_sessions ADD CONSTRAINT math_game_sessions_difficulty_check 
  CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme'));

ALTER TABLE math_game_high_scores DROP CONSTRAINT IF EXISTS math_game_high_scores_difficulty_check;
ALTER TABLE math_game_high_scores ADD CONSTRAINT math_game_high_scores_difficulty_check 
  CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme'));
