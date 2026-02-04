-- Migration: Multi-Tenant School Management
-- Description: Add schools table and school_id columns to all tenant-scoped tables
-- Date: 2025-02-04

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., "stpeters", "riverside" (for URL-friendly identifier)
    settings JSONB DEFAULT '{}', -- Custom school settings
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add school_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;

-- Update users role constraint to include super_admin
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'teacher', 'super_admin'));

-- Add school_id to accounts table (for direct queries)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- Add school_id to transactions table (for direct queries)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- Add school_id to town_settings table (change unique constraint to composite)
ALTER TABLE town_settings 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Drop old unique constraint on class
ALTER TABLE town_settings 
DROP CONSTRAINT IF EXISTS town_settings_class_key;

-- Add composite unique constraint on school_id + class
ALTER TABLE town_settings 
ADD CONSTRAINT town_settings_school_class_unique UNIQUE (school_id, class);

-- Add school_id to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to tenders table
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Drop old unique constraint on jobs.name
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_name_key;

-- Add composite unique constraint on school_id + name
ALTER TABLE jobs 
ADD CONSTRAINT jobs_school_name_unique UNIQUE (school_id, name);

-- Add school_id to land_parcels table
ALTER TABLE land_parcels 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to plugins table (plugins can be per-school or global)
ALTER TABLE plugins 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Drop old unique constraint on plugins.name
ALTER TABLE plugins 
DROP CONSTRAINT IF EXISTS plugins_name_key;

-- Add composite unique constraint on school_id + name (NULL school_id = global plugin)
ALTER TABLE plugins 
ADD CONSTRAINT plugins_school_name_unique UNIQUE (school_id, name);

-- Add school_id to tax_transactions table
ALTER TABLE tax_transactions 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to treasury_transactions table
ALTER TABLE treasury_transactions 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to tax_brackets table (can be per-school or global)
ALTER TABLE tax_brackets 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to tender_applications table
ALTER TABLE tender_applications 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to land_purchase_requests table
ALTER TABLE land_purchase_requests 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to shop_items table
ALTER TABLE shop_items 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to shop_purchases table
ALTER TABLE shop_purchases 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to shop_balance table
ALTER TABLE shop_balance 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to pizza_time table
ALTER TABLE pizza_time 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to pizza_time_donations table
ALTER TABLE pizza_time_donations 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to town_rules table
ALTER TABLE town_rules 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to suggestions table
ALTER TABLE suggestions 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to bug_reports table
ALTER TABLE bug_reports 
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_archived ON schools(archived);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_accounts_school_id ON accounts(school_id);
CREATE INDEX IF NOT EXISTS idx_transactions_school_id ON transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_town_settings_school_id ON town_settings(school_id);
CREATE INDEX IF NOT EXISTS idx_town_settings_school_class ON town_settings(school_id, class);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_town_class ON announcements(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_tenders_school_id ON tenders(school_id);
CREATE INDEX IF NOT EXISTS idx_tenders_school_town_class ON tenders(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_jobs_school_id ON jobs(school_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_school_id ON land_parcels(school_id);
CREATE INDEX IF NOT EXISTS idx_plugins_school_id ON plugins(school_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_school_id ON tax_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_school_id ON treasury_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_tax_brackets_school_id ON tax_brackets(school_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_school_id ON job_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_tender_applications_school_id ON tender_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_school_id ON land_purchase_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_school_id ON shop_items(school_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_school_id ON shop_purchases(school_id);
CREATE INDEX IF NOT EXISTS idx_shop_balance_school_id ON shop_balance(school_id);
CREATE INDEX IF NOT EXISTS idx_pizza_time_school_id ON pizza_time(school_id);
CREATE INDEX IF NOT EXISTS idx_pizza_time_donations_school_id ON pizza_time_donations(school_id);
CREATE INDEX IF NOT EXISTS idx_town_rules_school_id ON town_rules(school_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_school_id ON suggestions(school_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_school_id ON bug_reports(school_id);

-- Create default school for existing data (St Peter's Boys Prep)
INSERT INTO schools (name, code, settings) 
VALUES ('St Peter''s Boys Prep', 'stpeters', '{"classes": ["6A", "6B", "6C"], "allowed_email_domains": ["@stpeters.co.za"]}')
ON CONFLICT (code) DO NOTHING;

-- Get the default school ID (assuming it's ID 1, but we'll query for it)
-- Backfill existing data with school_id = 1 (St Peter's Boys Prep)
-- Note: This assumes the school was just created with ID 1, or we need to query for it

-- Backfill users
UPDATE users SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) WHERE school_id IS NULL;

-- Backfill accounts (via users)
UPDATE accounts a 
SET school_id = u.school_id 
FROM users u 
WHERE a.user_id = u.id AND a.school_id IS NULL;

-- Backfill transactions (via accounts)
UPDATE transactions t 
SET school_id = COALESCE(
    (SELECT school_id FROM accounts WHERE id = t.from_account_id),
    (SELECT school_id FROM accounts WHERE id = t.to_account_id)
)
WHERE t.school_id IS NULL;

-- Backfill town_settings
UPDATE town_settings 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill announcements
UPDATE announcements 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill tenders
UPDATE tenders 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill jobs
UPDATE jobs 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill land_parcels
UPDATE land_parcels 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill tax_transactions (via users)
UPDATE tax_transactions tt
SET school_id = u.school_id
FROM users u
WHERE tt.user_id = u.id AND tt.school_id IS NULL;

-- Backfill treasury_transactions (via town_class -> town_settings)
UPDATE treasury_transactions tt
SET school_id = ts.school_id
FROM town_settings ts
WHERE tt.town_class = ts.class AND tt.school_id IS NULL;

-- Backfill tax_brackets (set to NULL for global, or assign to school)
-- Keep existing as global (school_id = NULL) for now

-- Backfill job_applications (via users)
UPDATE job_applications ja
SET school_id = u.school_id
FROM users u
WHERE ja.applicant_id = u.id AND ja.school_id IS NULL;

-- Backfill tender_applications (via users)
UPDATE tender_applications ta
SET school_id = u.school_id
FROM users u
WHERE ta.applicant_id = u.id AND ta.school_id IS NULL;

-- Backfill land_purchase_requests (via users)
UPDATE land_purchase_requests lpr
SET school_id = u.school_id
FROM users u
WHERE lpr.user_id = u.id AND lpr.school_id IS NULL;

-- Backfill shop_items
UPDATE shop_items 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill shop_purchases (via users)
UPDATE shop_purchases sp
SET school_id = u.school_id
FROM users u
WHERE sp.user_id = u.id AND sp.school_id IS NULL;

-- Backfill shop_balance
UPDATE shop_balance 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill pizza_time
UPDATE pizza_time 
SET school_id = (SELECT id FROM schools WHERE code = 'stpeters' LIMIT 1) 
WHERE school_id IS NULL;

-- Backfill pizza_time_donations (via users)
UPDATE pizza_time_donations ptd
SET school_id = u.school_id
FROM users u
WHERE ptd.user_id = u.id AND ptd.school_id IS NULL;

-- Backfill town_rules (via town_class -> town_settings)
UPDATE town_rules tr
SET school_id = ts.school_id
FROM town_settings ts
WHERE tr.town_class = ts.class AND tr.school_id IS NULL;

-- Backfill suggestions (via users)
UPDATE suggestions s
SET school_id = u.school_id
FROM users u
WHERE s.user_id = u.id AND s.school_id IS NULL;

-- Backfill bug_reports (via users)
UPDATE bug_reports br
SET school_id = u.school_id
FROM users u
WHERE br.user_id = u.id AND br.school_id IS NULL;

-- Backfill plugins (set to NULL for global plugins, or assign to school)
-- For now, keep existing plugins as global (school_id = NULL)
-- This allows plugins to be shared or per-school

-- Add NOT NULL constraints after backfilling (where appropriate)
-- Note: We'll keep school_id nullable for super_admin users and global plugins
ALTER TABLE users 
ALTER COLUMN school_id SET NOT NULL;

-- But allow NULL for super_admin users - we'll handle this in application logic
ALTER TABLE users 
ALTER COLUMN school_id DROP NOT NULL;

-- Add check constraint: super_admin must have school_id = NULL, others must have school_id
-- Note: This constraint will fail if there are existing users, so we'll handle it in application logic
-- For now, we'll skip this constraint and enforce it in the application layer
-- ALTER TABLE users 
-- ADD CONSTRAINT users_school_role_check CHECK (
--     (role = 'super_admin' AND school_id IS NULL) OR 
--     (role != 'super_admin' AND school_id IS NOT NULL)
-- );
