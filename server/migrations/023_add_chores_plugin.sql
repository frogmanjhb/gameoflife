-- Add Chores plugin
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Chores', true, '/chores', '🧹', 'Earn money by completing chore challenges at home')
ON CONFLICT (route_path) DO NOTHING;
