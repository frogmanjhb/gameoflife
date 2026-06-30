-- Migration: Add Town Rules Table
-- Description: Add table for town-specific rules (one per town/class)
-- Date: 2025-01-XX

-- Town rules table (per-town rules)
CREATE TABLE IF NOT EXISTS town_rules (
    id SERIAL PRIMARY KEY,
    town_class VARCHAR(10) NOT NULL UNIQUE CHECK (town_class IN ('6A', '6B', '6C')),
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_town_rules_town_class ON town_rules(town_class);

-- Initialize empty rules for each town (idempotent; avoids ON CONFLICT on town_class
-- after migration 101 replaces UNIQUE(town_class) with UNIQUE(town_class, school_id))
INSERT INTO town_rules (town_class, rules)
SELECT v.town_class, NULL::TEXT
FROM (VALUES ('6A'), ('6B'), ('6C')) AS v(town_class)
WHERE NOT EXISTS (
  SELECT 1 FROM town_rules tr WHERE tr.town_class = v.town_class
);
