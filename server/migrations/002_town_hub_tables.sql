-- Migration: Add Town Hub Tables
-- Description: Add tables for plugins, announcements, town_settings, and jobs. Add job_id to users table.
-- Date: 2024-01-XX

-- Plugins table (shared across all towns)
CREATE TABLE IF NOT EXISTS plugins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    route_path VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table (available jobs in the town)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    salary DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Town settings table (one per class: 6A, 6B, 6C)
CREATE TABLE IF NOT EXISTS town_settings (
    id SERIAL PRIMARY KEY,
    class VARCHAR(10) NOT NULL UNIQUE CHECK (class IN ('6A', '6B', '6C')),
    town_name VARCHAR(255) NOT NULL,
    mayor_name VARCHAR(255),
    tax_rate DECIMAL(5,2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table (per-town announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add job_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plugins_enabled ON plugins(enabled);
CREATE INDEX IF NOT EXISTS idx_announcements_town_class ON announcements(town_class);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_town_settings_class ON town_settings(class);
CREATE INDEX IF NOT EXISTS idx_users_job_id ON users(job_id);

