-- Migration: Add missing plugins (Town Rules and The Winkel)
-- Description: Ensures Town Rules and The Winkel plugins exist in the database
-- Date: 2025-01-XX

-- Add Town Rules plugin if it doesn't exist
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Town Rules', true, '/town-rules', '📜', 'Town-specific rules and regulations')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Add The Winkel plugin if it doesn't exist
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('The Winkel', true, '/winkel', '🛒', 'Weekly shop for consumables and privileges')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
