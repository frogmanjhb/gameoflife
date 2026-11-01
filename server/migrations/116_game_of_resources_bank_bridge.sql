-- Game of Resources: optional teacher-approved coin → bank conversion
-- Idempotent migration

CREATE TABLE IF NOT EXISTS gor_coin_redemptions (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES gor_worlds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_coins INTEGER NOT NULL CHECK (game_coins >= 1),
    bank_amount NUMERIC(12, 2) NOT NULL CHECK (bank_amount > 0),
    coins_per_rand INTEGER NOT NULL CHECK (coins_per_rand >= 1),
    status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gor_coin_redemptions_world_status
    ON gor_coin_redemptions(world_id, status);

CREATE INDEX IF NOT EXISTS idx_gor_coin_redemptions_user
    ON gor_coin_redemptions(user_id, created_at DESC);
