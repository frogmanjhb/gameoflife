-- Migration: Add Pizza Time Tables
-- Description: Add tables for pizza time donations and tracking per class
-- Date: 2025-01-XX

-- Pizza time table (one per class)
CREATE TABLE IF NOT EXISTS pizza_time (
    id SERIAL PRIMARY KEY,
    class VARCHAR(10) NOT NULL UNIQUE CHECK (class IN ('6A', '6B', '6C')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    current_fund DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    goal_amount DECIMAL(10,2) NOT NULL DEFAULT 100000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pizza time donations table (tracks individual donations)
CREATE TABLE IF NOT EXISTS pizza_time_donations (
    id SERIAL PRIMARY KEY,
    pizza_time_id INTEGER NOT NULL REFERENCES pizza_time(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pizza_time_class ON pizza_time(class);
CREATE INDEX IF NOT EXISTS idx_pizza_time_active ON pizza_time(is_active);
CREATE INDEX IF NOT EXISTS idx_pizza_time_donations_pizza_time_id ON pizza_time_donations(pizza_time_id);
CREATE INDEX IF NOT EXISTS idx_pizza_time_donations_user_id ON pizza_time_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_pizza_time_donations_created_at ON pizza_time_donations(created_at);

-- Initialize pizza_time records for each class if they don't exist (idempotent: no ON CONFLICT so works after 032 changes unique to (class, school_id))
INSERT INTO pizza_time (class, is_active, current_fund, goal_amount)
SELECT v.class, v.is_active, v.current_fund, v.goal_amount
FROM (VALUES
    ('6A'::varchar(10), false::boolean, 0.00::decimal(10,2), 100000.00::decimal(10,2)),
    ('6B'::varchar(10), false::boolean, 0.00::decimal(10,2), 100000.00::decimal(10,2)),
    ('6C'::varchar(10), false::boolean, 0.00::decimal(10,2), 100000.00::decimal(10,2))
) AS v(class, is_active, current_fund, goal_amount)
WHERE NOT EXISTS (SELECT 1 FROM pizza_time p WHERE p.class = v.class);
