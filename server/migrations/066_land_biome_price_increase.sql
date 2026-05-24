-- 25% price increase for seven land biomes (matches BIOME_CONFIG baseValue × ±20% variation)
UPDATE land_parcels
SET value = ROUND(
  CASE biome_type
    WHEN 'Savanna' THEN 50000
    WHEN 'Grassland' THEN 37500
    WHEN 'Forest' THEN 87500
    WHEN 'Nama Karoo' THEN 25000
    WHEN 'Succulent Karoo' THEN 11250
    WHEN 'Desert' THEN 20000
    WHEN 'Thicket' THEN 62500
  END * (0.8 + (((row_index * col_index) % 100) / 250.0))
),
updated_at = CURRENT_TIMESTAMP
WHERE biome_type IN (
  'Savanna', 'Grassland', 'Forest',
  'Nama Karoo', 'Succulent Karoo', 'Desert', 'Thicket'
);
