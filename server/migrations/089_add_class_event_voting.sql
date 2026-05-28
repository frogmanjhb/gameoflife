-- Migration: Class Event Voting Board
-- Event planners suggest 5-min class events; students vote once per event; teacher controls board.

CREATE TABLE IF NOT EXISTS class_event_voting_settings (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    teacher_board_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, town_class)
);

CREATE TABLE IF NOT EXISTS class_event_voting_student_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    board_visible BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_events (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    suggested_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    timing VARCHAR(20) NOT NULL CHECK (timing IN ('before_class', 'after_class', 'during_class')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    reward_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_event_votes (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES class_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_events_town ON class_events(school_id, town_class, status);
CREATE INDEX IF NOT EXISTS idx_class_events_suggester_week ON class_events(suggested_by_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_class_event_votes_event ON class_event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_class_event_votes_user ON class_event_votes(user_id);

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
      WHERE route_path = '/event-voting' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/event-voting'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        'Event Voting Board',
        false,
        '/event-voting',
        '🗳️',
        'Vote on fun 5-minute class events suggested by your Event Planner',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        'Event Voting Board',
        false,
        '/event-voting',
        '🗳️',
        'Vote on fun 5-minute class events suggested by your Event Planner'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
