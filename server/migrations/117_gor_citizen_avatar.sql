-- Citizen avatar appearance and optional map position (cosmetic only).

ALTER TABLE gor_citizens
  ADD COLUMN IF NOT EXISTS avatar JSONB NOT NULL DEFAULT '{"skin":"#f0c8a0","clothes":null,"ring":"#ffd166","pos":null}'::jsonb;
