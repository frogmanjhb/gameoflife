-- Migration: Add Job Applications Enabled Setting
-- Description: Add job_applications_enabled field to town_settings to allow teachers to control when students can apply for jobs
-- Date: 2025-02-09

-- Add job_applications_enabled column to town_settings
ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS job_applications_enabled BOOLEAN DEFAULT true;
