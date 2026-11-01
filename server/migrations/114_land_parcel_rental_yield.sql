-- Per-plot weekly rental income rate (percent of appreciated value, e.g. 5 = 5%)

ALTER TABLE land_parcels
ADD COLUMN IF NOT EXISTS rental_yield_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00;

UPDATE land_parcels
SET rental_yield_percent = 5.00
WHERE rental_yield_percent IS NULL;
