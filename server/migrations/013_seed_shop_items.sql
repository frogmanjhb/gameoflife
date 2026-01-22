-- Migration: Seed Shop Items
-- Description: Add all shop items to the shop_items table
-- Date: 2025-01-XX

-- Insert shop items (only if they don't already exist by name)
-- Note: We check for existing items by name since there's no unique constraint on name
DO $$
BEGIN
  -- Consumables
  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Sweet / Lolly') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Sweet / Lolly', 'consumable', 350.00, 'A delicious sweet treat', 'One-off purchase', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Chocolate Square') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Chocolate Square', 'consumable', 560.00, 'Premium chocolate square', 'Premium sweet', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Sticker') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Sticker', 'consumable', 420.00, 'Choose your favorite sticker', 'Let them choose', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Extra Sticker Pack') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Extra Sticker Pack', 'consumable', 1120.00, 'A bundle of stickers', 'Bundled value', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Popcorn (Small Cup)') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Popcorn (Small Cup)', 'consumable', 700.00, 'Fresh popcorn in a small cup', 'Event day only', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Jelly Baby / Gummy') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Jelly Baby / Gummy', 'consumable', 350.00, 'Chewy gummy treat', 'Easy win', true, false);
  END IF;

  -- Privileges
  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '5 min Free Time') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('5 min Free Time', 'privilege', 1400.00, '5 minutes of free time during class', 'Once per week max', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = '10 min Free Time') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('10 min Free Time', 'privilege', 2520.00, '10 minutes of free time during class', 'Cap weekly', true, false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Cushion to Sit On (Day)') THEN
    INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
    VALUES ('Cushion to Sit On (Day)', 'privilege', 1680.00, 'Comfortable cushion for the day', 'Comfort matters', true, false);
  END IF;
END $$;
