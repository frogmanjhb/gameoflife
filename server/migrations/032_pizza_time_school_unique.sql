-- Migration: Allow multiple pizza_time rows per class (one per school)
-- Description: Replace UNIQUE(class) with UNIQUE(class, school_id) so each school has its own 6A/6B/6C pizza time.
-- Fixes 500 when teacher from a non-backfilled school fetches pizza time status.
-- Date: 2025-02

-- Drop the original unique constraint on class only (PostgreSQL names it pizza_time_class_key)
ALTER TABLE pizza_time DROP CONSTRAINT IF EXISTS pizza_time_class_key;

-- Add composite unique so each (class, school_id) can exist once; multiple schools can have 6A, 6B, 6C
-- NULL school_id = legacy/global; each school_id gets its own set
ALTER TABLE pizza_time
  ADD CONSTRAINT pizza_time_class_school_unique UNIQUE (class, school_id);
