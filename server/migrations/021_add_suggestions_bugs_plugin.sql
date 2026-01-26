-- Migration: Add Suggestions & Bugs plugin
-- Description: Add the Suggestions & Bugs plugin to the plugins table
-- Date: 2026-01-26

INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES (
  'Suggestions & Bugs',
  true,
  '/suggestions-bugs',
  '💡🐛',
  'Students can submit suggestions and bug reports for teacher review and rewards'
)
ON CONFLICT (route_path) DO NOTHING;

