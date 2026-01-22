-- Migration: Add Pizza Time Plugin
-- Description: Add Pizza Time plugin to the plugins table
-- Date: 2025-01-XX

-- Add Pizza Time plugin if it doesn't exist
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Pizza Time', true, '/pizza-time', '🍕', 'Donate towards a class pizza party!')
ON CONFLICT (name) DO UPDATE SET
  route_path = EXCLUDED.route_path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
