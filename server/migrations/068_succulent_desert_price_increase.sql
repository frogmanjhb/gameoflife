-- Succulent Karoo +50%, Desert +25% (matches BIOME_CONFIG baseValue × ±20% variation)
UPDATE land_parcels
SET value = ROUND(
  CASE biome_type
    WHEN 'Succulent Karoo' THEN 16875
    WHEN 'Desert' THEN 25000
  END * (0.8 + (((row_index * col_index) % 100) / 250.0))
),
updated_at = CURRENT_TIMESTAMP
WHERE biome_type IN ('Succulent Karoo', 'Desert');
