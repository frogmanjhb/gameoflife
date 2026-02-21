-- Migration: Add Pizza Time Plugin
-- Description: Add Pizza Time plugin to the plugins table
-- Date: 2025-01-XX

-- Add Pizza Time plugin if it doesn't exist
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
      WHERE route_path = '/pizza-time' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/pizza-time'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Pizza Time', true, '/pizza-time', '🍕', 'Donate towards a class pizza party!', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Pizza Time', true, '/pizza-time', '🍕', 'Donate towards a class pizza party!');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
