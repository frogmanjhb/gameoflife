-- Migration: Add Analytics plugin
-- Description: Teacher-only analytics plugin for engagement data visualization
-- Date: 2025-02-12

DO $$
DECLARE
  has_school_id_col BOOLEAN;
  plugin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plugins' AND column_name = 'school_id'
  ) INTO has_school_id_col;
  
  IF has_school_id_col THEN
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/analytics' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/analytics'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Analytics', true, '/analytics', '📊', 'View engagement analytics with charts and graphs', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Analytics', true, '/analytics', '📊', 'View engagement analytics with charts and graphs');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
