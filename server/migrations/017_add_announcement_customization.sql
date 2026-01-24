-- Migration: Add color and wiggle animation to announcements
-- Description: Add background_color and enable_wiggle fields for visual customization
-- Date: 2025-01-24

-- Add background_color column (5 preset colors)
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT 'blue' 
CHECK (background_color IN ('blue', 'green', 'yellow', 'red', 'purple'));

-- Add enable_wiggle column for animation effect
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS enable_wiggle BOOLEAN DEFAULT false;

-- Update existing announcements to use default color
UPDATE announcements SET background_color = 'blue' WHERE background_color IS NULL;
UPDATE announcements SET enable_wiggle = false WHERE enable_wiggle IS NULL;
