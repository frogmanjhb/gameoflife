-- Hide older transactions in UI/API without deleting rows (per town/class).
ALTER TABLE town_settings
  ADD COLUMN IF NOT EXISTS transaction_history_cleared_at TIMESTAMPTZ;
