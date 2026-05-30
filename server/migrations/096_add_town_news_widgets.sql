-- Migration: Town News story widgets (badges, styles, accents, emojis)
-- Description: Optional JSON widgets on town_news_stories for contributor posts.

ALTER TABLE town_news_stories
  ADD COLUMN IF NOT EXISTS widgets JSONB NOT NULL DEFAULT '{}';
