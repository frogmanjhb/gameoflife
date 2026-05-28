-- Migration: Teacher insurance refund (90% of premium)

ALTER TABLE insurance_purchases
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS refunded_by INTEGER REFERENCES users(id);

ALTER TABLE insurance_purchases DROP CONSTRAINT IF EXISTS insurance_purchases_status_check;

ALTER TABLE insurance_purchases
  ADD CONSTRAINT insurance_purchases_status_check
  CHECK (status IN ('pending_broker', 'approved', 'denied', 'refunded'));
