-- Fixed plot prices: each biome uses its base value (no ±20% variation)
UPDATE land_parcels
SET value = CASE biome_type
  WHEN 'Savanna' THEN 75000
  WHEN 'Grassland' THEN 56250
  WHEN 'Forest' THEN 131250
  WHEN 'Fynbos' THEN 135000
  WHEN 'Nama Karoo' THEN 58595
  WHEN 'Succulent Karoo' THEN 37970
  WHEN 'Desert' THEN 67500
  WHEN 'Thicket' THEN 93750
  WHEN 'Indian Ocean Coastal Belt' THEN 180000
END,
updated_at = CURRENT_TIMESTAMP;
