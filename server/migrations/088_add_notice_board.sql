-- Migration: Graphic Designer Notice Board
-- Description: Posters uploaded by graphic designers; town-scoped notice board plugin with weekly earnings.

CREATE TABLE IF NOT EXISTS notice_board_settings (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    designer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    last_payout_collected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, town_class)
);

CREATE TABLE IF NOT EXISTS notice_board_posters (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    designer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    image_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notice_board_settings_town ON notice_board_settings(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_notice_board_posters_town ON notice_board_posters(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_notice_board_posters_designer ON notice_board_posters(designer_user_id);

-- Add Notice Board plugin (global, disabled by default — teacher enables; graphic designer toggles per town)
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
      WHERE route_path = '/notice-board' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/notice-board'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES ('Notice Board', false, '/notice-board', '📌', 'Posters and advertising from your town graphic designer', NULL);
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES ('Notice Board', false, '/notice-board', '📌', 'Posters and advertising from your town graphic designer');
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
