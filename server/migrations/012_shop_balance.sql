-- Migration: Add Shop Balance
-- Description: Add shop balance tracking for The Winkel
-- Date: 2025-01-XX

-- Shop balance table (one balance for the entire shop, not per town)
-- Using a single row with id=1 for simplicity
CREATE TABLE IF NOT EXISTS shop_balance (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize shop balance if it doesn't exist
INSERT INTO shop_balance (id, balance) VALUES (1, 0.00)
ON CONFLICT (id) DO NOTHING;
