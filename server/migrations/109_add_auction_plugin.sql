-- Migration: Class Auction plugin
-- Soft-bid auctions scoped by school + town class; no balance changes on bid/end.

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    name VARCHAR(200) NOT NULL,
    starting_price DECIMAL(12, 2) NOT NULL CHECK (starting_price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'ended')),
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    winning_bid DECIMAL(12, 2),
    went_live_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auctions_town_status ON auctions(school_id, town_class, status);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);

CREATE TABLE IF NOT EXISTS auction_bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_amount ON auction_bids(auction_id, amount DESC);

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
      WHERE route_path = '/auction' AND school_id IS NULL
    ) INTO plugin_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM plugins
      WHERE route_path = '/auction'
    ) INTO plugin_exists;
  END IF;

  IF NOT plugin_exists THEN
    IF has_school_id_col THEN
      INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
      VALUES (
        'Auction',
        false,
        '/auction',
        '🔨',
        'Live class auctions — bid on items; teacher ends and awards the prize',
        NULL
      );
    ELSE
      INSERT INTO plugins (name, enabled, route_path, icon, description)
      VALUES (
        'Auction',
        false,
        '/auction',
        '🔨',
        'Live class auctions — bid on items; teacher ends and awards the prize'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
