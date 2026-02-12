-- Migration: Add Analytics plugin
-- Description: Teacher-only analytics plugin for engagement data visualization
-- Date: 2025-02-12

INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Analytics', true, '/analytics', '📊', 'View engagement analytics with charts and graphs')
ON CONFLICT (route_path) DO NOTHING;
