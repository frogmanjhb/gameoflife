-- Migration: Software Engineer Code Board
-- Description: Town-scoped app links with stars and click rewards for creators.

CREATE TABLE IF NOT EXISTS code_board_apps (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    engineer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    star_count INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS code_board_stars (
    id SERIAL PRIMARY KEY,
    app_id INTEGER NOT NULL REFERENCES code_board_apps(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (app_id, user_id)
);

CREATE TABLE IF NOT EXISTS code_board_clicks (
    id SERIAL PRIMARY KEY,
    app_id INTEGER NOT NULL REFERENCES code_board_apps(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_code_board_apps_town ON code_board_apps(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_code_board_apps_engineer ON code_board_apps(engineer_user_id);
CREATE INDEX IF NOT EXISTS idx_code_board_stars_app ON code_board_stars(app_id);
CREATE INDEX IF NOT EXISTS idx_code_board_clicks_app ON code_board_clicks(app_id);

-- Add Code Board plugin (global, disabled by default — teacher enables)
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
      WHERE route_path = '/code-board' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/code-board'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Code Board', false, '/code-board', '💻', 'Apps built by your town software engineers — star and try them out', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Code Board', false, '/code-board', '💻', 'Apps built by your town software engineers — star and try them out');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
