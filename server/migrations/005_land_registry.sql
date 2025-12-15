-- Migration: Land Registry System
-- Description: Add tables for land parcels and purchase requests
-- Date: 2024-12-15

-- Land parcels table (10,000 parcels for 100x100 grid)
CREATE TABLE IF NOT EXISTS land_parcels (
    id SERIAL PRIMARY KEY,
    grid_code VARCHAR(10) NOT NULL UNIQUE,
    row_index INTEGER NOT NULL,
    col_index INTEGER NOT NULL,
    biome_type VARCHAR(50) NOT NULL CHECK (biome_type IN (
        'Savanna', 'Grassland', 'Forest', 'Fynbos', 
        'Nama Karoo', 'Succulent Karoo', 'Desert', 
        'Thicket', 'Indian Ocean Coastal Belt'
    )),
    value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(row_index, col_index)
);

-- Land purchase requests table (teacher approval queue)
CREATE TABLE IF NOT EXISTS land_purchase_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parcel_id INTEGER NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    offered_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, parcel_id, status)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_land_parcels_grid_code ON land_parcels(grid_code);
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner_id ON land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_biome_type ON land_parcels(biome_type);
CREATE INDEX IF NOT EXISTS idx_land_parcels_row_col ON land_parcels(row_index, col_index);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_user_id ON land_purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_parcel_id ON land_purchase_requests(parcel_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_status ON land_purchase_requests(status);

