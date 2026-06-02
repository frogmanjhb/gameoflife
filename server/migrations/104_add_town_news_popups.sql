-- Migration: Town News login pop-up advertising
-- Students with Town News jobs can submit pop-ups; R1000 charged on teacher approval.

CREATE TABLE IF NOT EXISTS town_news_popups (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    creator_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    image_data TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    denial_reason TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    payment_charged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS town_news_popup_dismissals (
    id SERIAL PRIMARY KEY,
    popup_id INTEGER NOT NULL REFERENCES town_news_popups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (popup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_town_news_popups_town_status
    ON town_news_popups (school_id, town_class, status);

CREATE INDEX IF NOT EXISTS idx_town_news_popup_dismissals_user
    ON town_news_popup_dismissals (user_id);
