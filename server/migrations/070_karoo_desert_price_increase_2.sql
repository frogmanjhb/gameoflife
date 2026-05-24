-- Nama Karoo +25%, Succulent Karoo +50%, Desert +50% (second round)
UPDATE land_parcels
SET value = ROUND(
  CASE biome_type
    WHEN 'Nama Karoo' THEN 39063
    WHEN 'Succulent Karoo' THEN 25313
    WHEN 'Desert' THEN 45000
  END * (0.8 + (((row_index * col_index) % 100) / 250.0))
),
updated_at = CURRENT_TIMESTAMP
WHERE biome_type IN ('Nama Karoo', 'Succulent Karoo', 'Desert');
