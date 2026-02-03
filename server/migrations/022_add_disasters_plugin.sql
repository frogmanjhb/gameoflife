-- Add Disasters plugin
INSERT INTO plugins (name, enabled, route_path, icon, description)
VALUES ('Disasters', true, '/disasters', '🌪️', 'View and manage disasters affecting all students')
ON CONFLICT (route_path) DO NOTHING;

-- Create disasters table for storing disaster types
CREATE TABLE IF NOT EXISTS disasters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🌪️',
    effect_type VARCHAR(50) NOT NULL, -- 'balance_percentage', 'balance_fixed', 'salary_percentage', etc.
    effect_value DECIMAL(10, 2) NOT NULL, -- The value of the effect (e.g., -10 for -10% or -100 for -R100)
    is_active BOOLEAN DEFAULT false,
    affects_all_classes BOOLEAN DEFAULT true,
    target_class VARCHAR(5), -- '6A', '6B', '6C' or NULL for all
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disaster events table for tracking when disasters are triggered
CREATE TABLE IF NOT EXISTS disaster_events (
    id SERIAL PRIMARY KEY,
    disaster_id INTEGER REFERENCES disasters(id) ON DELETE CASCADE,
    triggered_by INTEGER REFERENCES users(id),
    target_class VARCHAR(5), -- '6A', '6B', '6C' or NULL for all
    affected_students INTEGER DEFAULT 0,
    total_impact DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_disaster_events_disaster_id ON disaster_events(disaster_id);
CREATE INDEX IF NOT EXISTS idx_disaster_events_triggered_at ON disaster_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_disasters_is_active ON disasters(is_active);
