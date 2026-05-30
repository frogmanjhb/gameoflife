-- Migration: Chartered Accountant client advice records
CREATE TABLE IF NOT EXISTS accountant_client_advice (
    id SERIAL PRIMARY KEY,
    accountant_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    advice_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accountant_client_advice_accountant
    ON accountant_client_advice (accountant_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accountant_client_advice_client
    ON accountant_client_advice (client_user_id, created_at DESC);
