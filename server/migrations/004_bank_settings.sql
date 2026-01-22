-- Bank Settings Table
CREATE TABLE IF NOT EXISTS bank_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default settings
INSERT INTO bank_settings (setting_key, setting_value, description)
VALUES 
  ('basic_salary_enabled', 'false', 'Enable automatic basic salary (R1500/week) for unemployed students'),
  ('basic_salary_amount', '1500', 'Amount of basic salary paid to unemployed students'),
  ('basic_salary_day', '1', 'Day of week for basic salary (1=Monday, 7=Sunday)'),
  ('basic_salary_hour', '7', 'Hour of day for basic salary processing (24h format)'),
  ('last_basic_salary_run', '', 'Timestamp of last basic salary processing')
ON CONFLICT (setting_key) DO NOTHING;


