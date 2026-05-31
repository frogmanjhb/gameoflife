-- Migration: Allow multiple town_rules rows per class (one per school)
-- Description: Replace UNIQUE(town_class) with UNIQUE(town_class, school_id) for multi-tenant town rules.
-- Fixes duplicate key "town_rules_town_class_key" when a school fetches rules for 6A/6B/6C.
-- Idempotent: safe to run multiple times.

ALTER TABLE town_rules DROP CONSTRAINT IF EXISTS town_rules_town_class_key;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'town_rules_town_class_school_unique') THEN
    ALTER TABLE town_rules ADD CONSTRAINT town_rules_town_class_school_unique UNIQUE (town_class, school_id);
  END IF;
END $$;
