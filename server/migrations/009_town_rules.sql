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

-- Initialize empty rules for each town
INSERT INTO town_rules (town_class, rules)
VALUES 
    ('6A', NULL),
    ('6B', NULL),
    ('6C', NULL)
ON CONFLICT (town_class) DO NOTHING;
