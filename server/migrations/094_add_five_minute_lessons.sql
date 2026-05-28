-- Migration: 5 Minute Lessons — teaching activities by Teacher/Principal students; teacher approval; student voting

CREATE TABLE IF NOT EXISTS five_minute_lesson_settings (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    teacher_board_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, town_class)
);

CREATE TABLE IF NOT EXISTS five_minute_lesson_student_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    board_visible BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS five_minute_lessons (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    suggested_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_content TEXT NOT NULL,
    timing VARCHAR(20) NOT NULL CHECK (timing IN ('before_class', 'after_class', 'during_class')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'denied', 'open', 'closed')),
    reward_paid BOOLEAN NOT NULL DEFAULT false,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS five_minute_lesson_votes (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES five_minute_lessons(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_five_minute_lessons_town ON five_minute_lessons(school_id, town_class, status);
CREATE INDEX IF NOT EXISTS idx_five_minute_lessons_suggester_week ON five_minute_lessons(suggested_by_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_five_minute_lesson_votes_lesson ON five_minute_lesson_votes(lesson_id);

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
      WHERE route_path = '/five-minute-lessons' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/five-minute-lessons'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        '5 Minute Lessons',
        false,
        '/five-minute-lessons',
        '📚',
        'Vote on 5-minute teaching activities suggested by your Teacher or Principal',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        '5 Minute Lessons',
        false,
        '/five-minute-lessons',
        '📚',
        'Vote on 5-minute teaching activities suggested by your Teacher or Principal'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
