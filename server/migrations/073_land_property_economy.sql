-- Land property economy: appreciation tracking, weekly rent, student-to-student sales

ALTER TABLE land_parcels
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS last_rent_collected_at TIMESTAMP;

UPDATE land_parcels
SET purchase_price = value
WHERE owner_id IS NOT NULL AND purchase_price IS NULL;

CREATE TABLE IF NOT EXISTS land_sale_requests (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sale_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_fm'
        CHECK (status IN ('pending_fm', 'pending_buyer', 'completed', 'denied', 'cancelled')),
    fm_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    fm_reviewed_at TIMESTAMP,
    denial_reason TEXT,
    buyer_responded_at TIMESTAMP,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_land_sale_active_parcel
  ON land_sale_requests(parcel_id)
  WHERE status IN ('pending_fm', 'pending_buyer');

CREATE INDEX IF NOT EXISTS idx_land_sale_seller ON land_sale_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_land_sale_buyer ON land_sale_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_land_sale_status ON land_sale_requests(status);
CREATE INDEX IF NOT EXISTS idx_land_sale_school ON land_sale_requests(school_id);
