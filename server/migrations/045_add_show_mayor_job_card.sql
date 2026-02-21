-- Migration: Add Show Mayor Job Card Setting
-- Description: Allow teachers to show/hide the Mayor job on the employment board (Mayor is elected, not applied for).
-- Date: 2025-02-21

ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS show_mayor_job_card BOOLEAN DEFAULT true;
