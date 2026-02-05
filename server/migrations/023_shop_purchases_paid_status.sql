-- Migration: Add paid status to shop purchases
-- Description: Add 'paid' column to track pending vs completed purchases
-- Date: 2026-02-05

-- Add paid column to shop_purchases table (default to true for existing records)
ALTER TABLE shop_purchases 
ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT true;

-- Add paid_at timestamp column
ALTER TABLE shop_purchases 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add paid_by column to track which teacher marked it as paid
ALTER TABLE shop_purchases 
ADD COLUMN IF NOT EXISTS paid_by INTEGER REFERENCES users(id);

-- Update existing purchases to be marked as paid (they were already fulfilled)
UPDATE shop_purchases 
SET paid = true, paid_at = created_at 
WHERE paid_at IS NULL;

-- Create index for filtering pending purchases
CREATE INDEX IF NOT EXISTS idx_shop_purchases_paid ON shop_purchases(paid);

-- For new purchases, we want them to start as pending (false)
-- So we'll update the default after backfilling existing data
ALTER TABLE shop_purchases ALTER COLUMN paid SET DEFAULT false;
