-- Migration: Add Suggestions & Bugs plugin
-- Description: Add the Suggestions & Bugs plugin to the plugins table
-- Date: 2026-01-26

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
      WHERE route_path = '/suggestions-bugs' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/suggestions-bugs'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        'Suggestions & Bugs',
        true,
        '/suggestions-bugs',
        '💡🐛',
        'Students can submit suggestions and bug reports for teacher review and rewards',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        'Suggestions & Bugs',
        true,
        '/suggestions-bugs',
        '💡🐛',
        'Students can submit suggestions and bug reports for teacher review and rewards'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

