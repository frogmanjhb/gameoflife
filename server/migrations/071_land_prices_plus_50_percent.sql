-- Increase all land parcel prices by 50%
UPDATE land_parcels
SET value = ROUND(value * 1.5),
    updated_at = CURRENT_TIMESTAMP;
