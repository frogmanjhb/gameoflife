-- Allow same plugin route_path per school (for school-bound enable/disable of global plugins)
-- Drop global UNIQUE(route_path) and add UNIQUE(school_id, route_path) so e.g. (NULL, '/bank') and (1, '/bank') can coexist.
-- Idempotent: safe to run multiple times.

ALTER TABLE plugins DROP CONSTRAINT IF EXISTS plugins_route_path_key;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugins_school_route_path_unique') THEN
    ALTER TABLE plugins ADD CONSTRAINT plugins_school_route_path_unique UNIQUE (school_id, route_path);
  END IF;
END $$;
