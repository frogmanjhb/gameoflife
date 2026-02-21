-- Add Disasters plugin
-- Check if plugin already exists before inserting (handles both pre-033 and post-033 schema)
DO $$
DECLARE
  has_school_id_col BOOLEAN;
  plugin_exists BOOLEAN;
BEGIN
  -- Check if school_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plugins' AND column_name = 'school_id'
  ) INTO has_school_id_col;
  
  -- Check if plugin already exists
  IF has_school_id_col THEN
    -- After migration 033: check for global plugin (school_id IS NULL)
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/disasters' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    -- Before migration 033: just check route_path
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE route_path = '/disasters'
    ) INTO plugin_exists;
  END IF;
  
  -- Insert plugin if it doesn't exist
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Disasters', true, '/disasters', '🌪️', 'View and manage disasters affecting all students', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Disasters', true, '/disasters', '🌪️', 'View and manage disasters affecting all students');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN
    -- If insert fails for any reason (e.g., constraint violation), ignore it
    NULL;
END $$;

-- Create disasters table for storing disaster types
CREATE TABLE IF NOT EXISTS disasters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🌪️',
    effect_type VARCHAR(50) NOT NULL, -- 'balance_percentage', 'balance_fixed', 'salary_percentage', etc.
    effect_value DECIMAL(10, 2) NOT NULL, -- The value of the effect (e.g., -10 for -10% or -100 for -R100)
    is_active BOOLEAN DEFAULT false,
    affects_all_classes BOOLEAN DEFAULT true,
    target_class VARCHAR(5), -- '6A', '6B', '6C' or NULL for all
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disaster events table for tracking when disasters are triggered
CREATE TABLE IF NOT EXISTS disaster_events (
    id SERIAL PRIMARY KEY,
    disaster_id INTEGER REFERENCES disasters(id) ON DELETE CASCADE,
    triggered_by INTEGER REFERENCES users(id),
    target_class VARCHAR(5), -- '6A', '6B', '6C' or NULL for all
    affected_students INTEGER DEFAULT 0,
    total_impact DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_disaster_events_disaster_id ON disaster_events(disaster_id);
CREATE INDEX IF NOT EXISTS idx_disaster_events_triggered_at ON disaster_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_disasters_is_active ON disasters(is_active);
