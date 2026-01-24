-- Add Leaderboard plugin
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Leaderboard', true, '/leaderboard', '🏆', 'View math game leaderboards for overall and class rankings')
ON CONFLICT (route_path) DO NOTHING;
