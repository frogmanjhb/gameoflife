-- Migration: Allow 'insurance' in transactions.transaction_type
-- Description: Insurance purchases insert transaction_type = 'insurance'; the table CHECK previously excluded it.
-- Date: 2025-02-XX

-- Drop existing check constraint on transaction_type (name may be default or custom)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'transactions' AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%transaction_type%'
  LOOP
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_transaction_type_check
  CHECK (transaction_type IN (
    'deposit', 'withdrawal', 'transfer',
    'loan_disbursement', 'loan_repayment', 'salary', 'fine', 'insurance'
  ));
