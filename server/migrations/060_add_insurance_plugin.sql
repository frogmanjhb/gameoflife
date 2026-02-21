-- Migration: Add Insurance plugin and insurance_purchases table
-- Description: Students can buy health, cyber, property insurance for 1+ weeks at 5% salary per type per week.
-- Date: 2025-02-XX

-- Insurance purchases: one row per purchase (one type, N weeks)
CREATE TABLE IF NOT EXISTS insurance_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insurance_type VARCHAR(20) NOT NULL CHECK (insurance_type IN ('health', 'cyber', 'property')),
    weeks INTEGER NOT NULL CHECK (weeks >= 1),
    total_cost DECIMAL(10,2) NOT NULL,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_purchases_user_id ON insurance_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_purchases_type ON insurance_purchases(insurance_type);
CREATE INDEX IF NOT EXISTS idx_insurance_purchases_week_start ON insurance_purchases(week_start_date);

-- Add Insurance plugin (global, school_id NULL)
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
      WHERE route_path = '/insurance' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/insurance'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Insurance', false, '/insurance', '🛡️', 'Health, cyber and property insurance (5% salary per type per week)', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Insurance', false, '/insurance', '🛡️', 'Health, cyber and property insurance (5% salary per type per week)');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
