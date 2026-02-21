-- Migration: Add missing plugins (Town Rules and The Winkel)
-- Description: Ensures Town Rules and The Winkel plugins exist in the database
-- Date: 2025-01-XX

-- Add Town Rules plugin if it doesn't exist
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
      WHERE route_path = '/town-rules' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/town-rules'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Town Rules', true, '/town-rules', '📜', 'Town-specific rules and regulations', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Town Rules', true, '/town-rules', '📜', 'Town-specific rules and regulations');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add The Winkel plugin if it doesn't exist
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
      WHERE route_path = '/winkel' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/winkel'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('The Winkel', true, '/winkel', '🛒', 'Weekly shop for consumables and privileges', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('The Winkel', true, '/winkel', '🛒', 'Weekly shop for consumables and privileges');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
