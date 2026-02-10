-- Add Doubles Day plugin (teacher toggle: double chore points, double pizza time donations)
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES (
  'Doubles Day',
  false,
  '/doubles-day',
  '2️⃣',
  'Double points from chores and double pizza time donations when enabled'
)
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
