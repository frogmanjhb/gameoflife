-- Migration: Town News Board (Journalist stories)
-- Description: Journalists submit town news stories with optional images; R5000 + 20 XP per submission.

CREATE TABLE IF NOT EXISTS town_news_stories (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    journalist_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    image_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_town_news_stories_town ON town_news_stories(school_id, town_class);
CREATE INDEX IF NOT EXISTS idx_town_news_stories_journalist ON town_news_stories(journalist_user_id);

-- Refresh Town News plugin description if it already exists
UPDATE plugins
SET description = 'Town News Board — stories and photos from your town journalists'
WHERE route_path = '/news';
