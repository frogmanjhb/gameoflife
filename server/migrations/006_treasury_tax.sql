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

-- Insert default progressive tax brackets aligned to job levels (base R2,000)
-- L1: 2%, L2: 4%, L3: 8%, L4: 16%, L5-7: 20%, L8-10: 25%
INSERT INTO tax_brackets (min_salary, max_salary, tax_rate) VALUES
    (0, 2700, 2),              -- L1 salary R2,000
    (2700.01, 4150, 4),        -- L2 salary R3,444
    (4150.01, 5600, 8),        -- L3 salary R4,889
    (5600.01, 7050, 16),       -- L4 salary R6,333
    (7050.01, 11400, 20),      -- L5-L7 salary R7,778 – R10,667
    (11400.01, NULL, 25)       -- L8-L10 salary R12,111 – R15,000
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

