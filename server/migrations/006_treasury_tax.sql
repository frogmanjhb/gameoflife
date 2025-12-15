-- Migration: Add Treasury and Tax System
-- Description: Add treasury balance to towns, tax settings, and tax transaction tracking
-- Date: 2024-12-15

-- Add treasury columns to town_settings
ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS treasury_balance DECIMAL(12,2) DEFAULT 10000000.00;
ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT true;

-- Tax brackets table - progressive tax rates based on salary
CREATE TABLE IF NOT EXISTS tax_brackets (
    id SERIAL PRIMARY KEY,
    min_salary DECIMAL(10,2) NOT NULL,
    max_salary DECIMAL(10,2),  -- NULL means no upper limit
    tax_rate DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax transactions table - track all tax collected
CREATE TABLE IF NOT EXISTS tax_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    gross_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    tax_rate_applied DECIMAL(5,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('salary', 'bonus', 'game_earnings')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treasury transactions table - track treasury inflows/outflows
CREATE TABLE IF NOT EXISTS treasury_transactions (
    id SERIAL PRIMARY KEY,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    amount DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('tax_collection', 'salary_payment', 'deposit', 'withdrawal', 'initial_balance')),
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default progressive tax brackets (South African-inspired but simplified for classroom)
-- These create a fair progressive tax system
INSERT INTO tax_brackets (min_salary, max_salary, tax_rate) VALUES
    (0, 500, 0),           -- R0-R500: 0% tax (poverty threshold)
    (500.01, 1500, 5),     -- R500-R1500: 5% tax (basic income)
    (1500.01, 3000, 10),   -- R1500-R3000: 10% tax (moderate income)
    (3000.01, 5000, 15),   -- R3000-R5000: 15% tax (above average)
    (5000.01, 10000, 20),  -- R5000-R10000: 20% tax (high income)
    (10000.01, NULL, 25)   -- R10000+: 25% tax (very high income)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tax_transactions_user_id ON tax_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_town_class ON tax_transactions(town_class);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_created_at ON tax_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_town_class ON treasury_transactions(town_class);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created_at ON treasury_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tax_brackets_salary ON tax_brackets(min_salary, max_salary);

-- Record initial treasury balance for existing towns
INSERT INTO treasury_transactions (town_class, amount, transaction_type, description)
SELECT class, 10000000.00, 'initial_balance', 'Initial town treasury allocation'
FROM town_settings
WHERE NOT EXISTS (
    SELECT 1 FROM treasury_transactions 
    WHERE treasury_transactions.town_class = town_settings.class 
    AND transaction_type = 'initial_balance'
);

