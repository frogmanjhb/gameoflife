-- Migration: Add Winkel Shop Tables
-- Description: Add tables for shop items and student purchases
-- Date: 2025-01-XX

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('consumable', 'privilege')),
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    notes TEXT,
    available BOOLEAN NOT NULL DEFAULT true,
    event_day_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student purchases table (tracks purchases and enforces weekly limit)
CREATE TABLE IF NOT EXISTS shop_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    price_paid DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_start_date DATE NOT NULL, -- Monday of the week this purchase was made
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date) -- One purchase per student per week
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_available ON shop_items(available);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_id ON shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item_id ON shop_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_week_start ON shop_purchases(week_start_date);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_purchase_date ON shop_purchases(purchase_date);
