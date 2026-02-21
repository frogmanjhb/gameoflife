-- Migration: Add Tenders system
-- Description: Add tenders + tender applications (town-scoped) and seed Tenders plugin
-- Date: 2025-12-15

-- Tenders table (per town/class)
CREATE TABLE IF NOT EXISTS tenders (
    id SERIAL PRIMARY KEY,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awarded', 'closed')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    awarded_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    awarded_application_id INTEGER,
    awarded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tender applications table
CREATE TABLE IF NOT EXISTS tender_applications (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tender_id, applicant_id)
);

-- Only one approved application per tender
CREATE UNIQUE INDEX IF NOT EXISTS idx_tender_applications_one_approved
  ON tender_applications (tender_id)
  WHERE status = 'approved';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenders_town_class ON tenders(town_class);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_created_at ON tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_tender_applications_tender_id ON tender_applications(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_applications_applicant_id ON tender_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_tender_applications_status ON tender_applications(status);

-- Seed plugin row (idempotent)
-- Check if plugin already exists before inserting (handles both pre-022 and post-022 schema)
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
    -- After migration 022: check for global plugin (school_id IS NULL)
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE name = 'Tenders' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    -- Before migration 022: just check name
    SELECT EXISTS (
      SELECT 1 FROM plugins 
      WHERE name = 'Tenders'
    ) INTO plugin_exists;
  END IF;
  
  -- Insert plugin if it doesn't exist
  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Tenders', true, '/tenders', '📑', 'Building jobs that need to happen on the game board', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Tenders', true, '/tenders', '📑', 'Building jobs that need to happen on the game board');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN
    -- If insert fails for any reason (e.g., constraint violation), ignore it
    NULL;
END $$;


