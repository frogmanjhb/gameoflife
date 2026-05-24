-- Nama Karoo +25%, Succulent Karoo +50%, Desert +50% (BIOME_CONFIG baseValue × ±20% variation)
UPDATE land_parcels
SET value = ROUND(
  CASE biome_type
    WHEN 'Nama Karoo' THEN 31250
    WHEN 'Succulent Karoo' THEN 16875
    WHEN 'Desert' THEN 30000
  END * (0.8 + (((row_index * col_index) % 100) / 250.0))
),
updated_at = CURRENT_TIMESTAMP
WHERE biome_type IN ('Nama Karoo', 'Succulent Karoo', 'Desert');
