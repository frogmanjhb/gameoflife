-- Migration: Game of Resources (Town Hub plugin)
-- One persistent cooperative world per (school_id, town_class).

CREATE TABLE IF NOT EXISTS gor_worlds (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    seed INTEGER NOT NULL CHECK (seed >= 1),
    seq INTEGER NOT NULL DEFAULT 1 CHECK (seq >= 1),
    round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number >= 1),
    round_open BOOLEAN NOT NULL DEFAULT TRUE,
    round_started_at TIMESTAMPTZ,
    round_ends_at TIMESTAMPTZ,
    paused BOOLEAN NOT NULL DEFAULT FALSE,
    treasury INTEGER NOT NULL DEFAULT 250 CHECK (treasury >= 0),
    env JSONB NOT NULL DEFAULT '{"forest":80,"soil":75,"water":80,"pollution":15,"habitat":80}'::jsonb,
    mined_total INTEGER NOT NULL DEFAULT 0 CHECK (mined_total >= 0),
    projects JSONB NOT NULL DEFAULT '{}'::jsonb,
    land JSONB NOT NULL DEFAULT '{}'::jsonb,
    works JSONB NOT NULL DEFAULT '{"reclaim":null,"link":null}'::jsonb,
    harvest JSONB NOT NULL DEFAULT '{}'::jsonb,
    tile_health JSONB NOT NULL DEFAULT '{}'::jsonb,
    rested JSONB NOT NULL DEFAULT '{}'::jsonb,
    stats JSONB,
    settled_rounds INTEGER[] NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gor_worlds_school_town_unique UNIQUE (school_id, town_class)
);

CREATE INDEX IF NOT EXISTS idx_gor_worlds_school ON gor_worlds(school_id);

CREATE TABLE IF NOT EXISTS gor_citizens (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profession VARCHAR(32) NOT NULL,
    nickname VARCHAR(80),
    coins INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0),
    food INTEGER NOT NULL DEFAULT 3 CHECK (food >= 0),
    wood INTEGER NOT NULL DEFAULT 2 CHECK (wood >= 0),
    stone INTEGER NOT NULL DEFAULT 1 CHECK (stone >= 0),
    tools INTEGER NOT NULL DEFAULT 0 CHECK (tools >= 0),
    ap INTEGER NOT NULL DEFAULT 6 CHECK (ap >= 0),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    hungry BOOLEAN NOT NULL DEFAULT FALSE,
    ap_used INTEGER NOT NULL DEFAULT 0 CHECK (ap_used >= 0),
    actions INTEGER NOT NULL DEFAULT 0 CHECK (actions >= 0),
    contrib INTEGER NOT NULL DEFAULT 0 CHECK (contrib >= 0),
    reflections JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_active_round INTEGER CHECK (last_active_round IS NULL OR last_active_round >= 1),
    job_changed_round INTEGER CHECK (job_changed_round IS NULL OR job_changed_round >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gor_citizens_world_user_unique UNIQUE (world_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gor_citizens_world ON gor_citizens(world_id);

CREATE TABLE IF NOT EXISTS gor_listings (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    listing_key VARCHAR(32) NOT NULL,
    seller_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item VARCHAR(16) NOT NULL CHECK (item IN ('food', 'wood', 'stone', 'tools')),
    qty INTEGER NOT NULL CHECK (qty >= 0),
    price INTEGER NOT NULL CHECK (price >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gor_listings_world_key_unique UNIQUE (world_id, listing_key)
);

CREATE INDEX IF NOT EXISTS idx_gor_listings_world ON gor_listings(world_id);

CREATE TABLE IF NOT EXISTS gor_log (
    id BIGSERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    citizen_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind VARCHAR(32) NOT NULL,
    text TEXT NOT NULL,
    seq INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gor_log_world_id_desc ON gor_log(world_id, id DESC);

CREATE TABLE IF NOT EXISTS gor_round_summaries (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    summary JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gor_round_summaries_world_round_unique UNIQUE (world_id, round_number)
);

CREATE TABLE IF NOT EXISTS gor_reflections (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    citizen_id INTEGER NOT NULL REFERENCES gor_citizens(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number >= 1),
    text VARCHAR(280) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gor_reflections_citizen_round_unique UNIQUE (citizen_id, round_number)
);

CREATE TABLE IF NOT EXISTS gor_job_changes (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    citizen_id INTEGER NOT NULL REFERENCES gor_citizens(id) ON DELETE CASCADE,
    from_profession VARCHAR(32) NOT NULL,
    to_profession VARCHAR(32) NOT NULL,
    xp_spent INTEGER NOT NULL CHECK (xp_spent >= 0),
    xp_source VARCHAR(16) NOT NULL DEFAULT 'game',
    round_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gor_job_changes_world ON gor_job_changes(world_id, created_at DESC);

DO $$
DECLARE
  has_school_id_col BOOLEAN;
  plugin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugins' AND column_name = 'school_id'
  ) INTO has_school_id_col;

  IF has_school_id_col THEN
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/game-of-resources' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/game-of-resources'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        'Game of Resources',
        false,
        '/game-of-resources',
        '🌍',
        'Cooperative village simulation — jobs, land, market and the shared 3D planet',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        'Game of Resources',
        false,
        '/game-of-resources',
        '🌍',
        'Cooperative village simulation — jobs, land, market and the shared 3D planet'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
