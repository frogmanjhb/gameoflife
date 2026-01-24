-- Migration: Profile Emoji System
-- Description: Add profile emoji field to users and emoji items to shop
-- Date: 2026-01-24

-- Add profile_emoji column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_emoji VARCHAR(10);

-- Add new category for profile items to shop_items
ALTER TABLE shop_items 
DROP CONSTRAINT IF EXISTS shop_items_category_check;

ALTER TABLE shop_items 
ADD CONSTRAINT shop_items_category_check 
CHECK (category IN ('consumable', 'privilege', 'profile'));

-- Insert profile emoji items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '😎 Cool Face Emoji') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('😎 Cool Face Emoji', 'profile', 1000.00, 'Show off your cool side with this emoji profile picture', 'Permanent profile customization', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '🤓 Nerd Face Emoji') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('🤓 Nerd Face Emoji', 'profile', 1000.00, 'Embrace your inner genius with this emoji profile picture', 'Permanent profile customization', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '🥳 Party Face Emoji') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('🥳 Party Face Emoji', 'profile', 1000.00, 'Celebrate every day with this party emoji profile picture', 'Permanent profile customization', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '🤠 Cowboy Emoji') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('🤠 Cowboy Emoji', 'profile', 1000.00, 'Ride into town with this cowboy emoji profile picture', 'Permanent profile customization', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '🧙 Wizard Emoji') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('🧙 Wizard Emoji', 'profile', 1000.00, 'Cast spells with this magical wizard emoji profile picture', 'Permanent profile customization', true, false);
  END IF;
END $$;
