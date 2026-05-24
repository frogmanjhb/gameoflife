-- Per-town land grids: each class (6A, 6B, 6C) has its own 10x10 registry

ALTER TABLE land_parcels
ADD COLUMN IF NOT EXISTS town_class VARCHAR(10);

UPDATE land_parcels
SET town_class = '6A'
WHERE town_class IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'land_parcels_town_class_check'
  ) THEN
    ALTER TABLE land_parcels
    ADD CONSTRAINT land_parcels_town_class_check
    CHECK (town_class IN ('6A', '6B', '6C'));
  END IF;
END $$;

ALTER TABLE land_parcels
ALTER COLUMN town_class SET NOT NULL;

ALTER TABLE land_parcels DROP CONSTRAINT IF EXISTS land_parcels_grid_code_key;
ALTER TABLE land_parcels DROP CONSTRAINT IF EXISTS land_parcels_row_index_col_index_key;

-- Duplicate existing 6A grids for 6B and 6C (unowned copies)
INSERT INTO land_parcels (
  grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, school_id, town_class
)
SELECT
  lp.grid_code, lp.row_index, lp.col_index, lp.biome_type, lp.value, lp.risk_level, lp.pros, lp.cons, lp.school_id, '6B'
FROM land_parcels lp
WHERE lp.town_class = '6A'
AND NOT EXISTS (
  SELECT 1 FROM land_parcels x
  WHERE x.town_class = '6B'
  AND x.school_id IS NOT DISTINCT FROM lp.school_id
);

INSERT INTO land_parcels (
  grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, school_id, town_class
)
SELECT
  lp.grid_code, lp.row_index, lp.col_index, lp.biome_type, lp.value, lp.risk_level, lp.pros, lp.cons, lp.school_id, '6C'
FROM land_parcels lp
WHERE lp.town_class = '6A'
AND NOT EXISTS (
  SELECT 1 FROM land_parcels x
  WHERE x.town_class = '6C'
  AND x.school_id IS NOT DISTINCT FROM lp.school_id
);

CREATE UNIQUE INDEX IF NOT EXISTS land_parcels_school_town_grid_unique
  ON land_parcels (COALESCE(school_id, -1), town_class, grid_code);

CREATE UNIQUE INDEX IF NOT EXISTS land_parcels_school_town_row_col_unique
  ON land_parcels (COALESCE(school_id, -1), town_class, row_index, col_index);

CREATE INDEX IF NOT EXISTS idx_land_parcels_town_class ON land_parcels(town_class);
CREATE INDEX IF NOT EXISTS idx_land_parcels_school_town ON land_parcels(school_id, town_class);
