-- Add Doubles Day plugin (teacher toggle: double chore points, double pizza time donations)
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
      WHERE route_path = '/doubles-day' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/doubles-day'
    ) INTO plugin_exists;
  END IF;
  
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        'Doubles Day',
        false,
        '/doubles-day',
        '2️⃣',
        'Double points from chores and double pizza time donations when enabled',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        'Doubles Day',
        false,
        '/doubles-day',
        '2️⃣',
        'Double points from chores and double pizza time donations when enabled'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
