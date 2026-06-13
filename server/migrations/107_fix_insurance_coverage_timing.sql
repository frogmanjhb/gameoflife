-- Migration: Fix insurance coverage timing and settle stuck clinic/cyber claims
-- 1) Backfill week_start_date so paid policies cover from purchase date
-- 2) Backdate policies where broker approval started coverage late
-- 3) Pay out stuck pending insurance claims (students waiting on broker)

UPDATE insurance_purchases
SET week_start_date = created_at::date
WHERE status IN ('pending_broker', 'approved')
  AND week_start_date IS NULL;

UPDATE insurance_purchases
SET week_start_date = created_at::date
WHERE status = 'approved'
  AND week_start_date IS NOT NULL
  AND week_start_date > created_at::date;

DO $$
DECLARE
  r RECORD;
  doctor_acc_id INTEGER;
  fee NUMERIC;
BEGIN
  FOR r IN
    SELECT a.id, a.cure_fee, a.illness_type, a.assigned_by_user_id, a.insurance_claim_requested_at
    FROM doctor_illness_assignments a
    WHERE a.insurance_claim_requested_at IS NOT NULL
      AND a.cure_requested_at IS NULL
      AND a.cured_at IS NULL
  LOOP
    SELECT id INTO doctor_acc_id FROM accounts WHERE user_id = r.assigned_by_user_id;
    IF doctor_acc_id IS NULL THEN
      CONTINUE;
    END IF;
    fee := COALESCE(r.cure_fee, 5000);
    UPDATE accounts
    SET balance = balance + fee, updated_at = CURRENT_TIMESTAMP
    WHERE id = doctor_acc_id;
    INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
    VALUES (
      NULL,
      doctor_acc_id,
      fee,
      'insurance',
      'Health insurance claim — ' || r.illness_type || ' clinic fee (backfill pending claim)'
    );
    UPDATE doctor_illness_assignments
    SET cure_requested_at = COALESCE(r.insurance_claim_requested_at, CURRENT_TIMESTAMP),
        cure_paid_at = COALESCE(r.insurance_claim_requested_at, CURRENT_TIMESTAMP),
        paid_by_insurance = TRUE,
        insurance_claim_reviewed_at = CURRENT_TIMESTAMP
    WHERE id = r.id;
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
  engineer_acc_id INTEGER;
  fee NUMERIC;
BEGIN
  FOR r IN
    SELECT a.id, a.repair_fee, a.attack_type, a.assigned_by_user_id, a.insurance_claim_requested_at
    FROM cyber_attack_assignments a
    WHERE a.insurance_claim_requested_at IS NOT NULL
      AND a.repair_requested_at IS NULL
      AND a.repaired_at IS NULL
  LOOP
    SELECT id INTO engineer_acc_id FROM accounts WHERE user_id = r.assigned_by_user_id;
    IF engineer_acc_id IS NULL THEN
      CONTINUE;
    END IF;
    fee := COALESCE(r.repair_fee, 5000);
    UPDATE accounts
    SET balance = balance + fee, updated_at = CURRENT_TIMESTAMP
    WHERE id = engineer_acc_id;
    INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
    VALUES (
      NULL,
      engineer_acc_id,
      fee,
      'insurance',
      'Cyber insurance claim — ' || r.attack_type || ' IT repair fee (backfill pending claim)'
    );
    UPDATE cyber_attack_assignments
    SET repair_requested_at = COALESCE(r.insurance_claim_requested_at, CURRENT_TIMESTAMP),
        repair_paid_at = COALESCE(r.insurance_claim_requested_at, CURRENT_TIMESTAMP),
        paid_by_insurance = TRUE,
        insurance_claim_reviewed_at = CURRENT_TIMESTAMP
    WHERE id = r.id;
  END LOOP;
END $$;
