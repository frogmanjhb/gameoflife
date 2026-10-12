-- Marker for one-time land rental income backpay (multi-week collect bug fix)

ALTER TABLE land_parcels
ADD COLUMN IF NOT EXISTS rent_backpay_applied_at TIMESTAMP;
