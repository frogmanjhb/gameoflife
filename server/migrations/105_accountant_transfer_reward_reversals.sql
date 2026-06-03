-- Track reversals of fraudulent accountant transfer approval rewards
CREATE TABLE IF NOT EXISTS accountant_transfer_reward_reversals (
    id SERIAL PRIMARY KEY,
    reward_transaction_id INTEGER NOT NULL UNIQUE REFERENCES transactions(id),
    accountant_user_id INTEGER NOT NULL REFERENCES users(id),
    reversal_transaction_id INTEGER REFERENCES transactions(id),
    reward_amount DECIMAL(10,2) NOT NULL,
    transfer_amount DECIMAL(10,2),
    pending_transfer_id INTEGER REFERENCES pending_transfers(id),
    exploit_reason TEXT NOT NULL,
    reversed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accountant_transfer_reward_reversals_accountant
    ON accountant_transfer_reward_reversals(accountant_user_id);
