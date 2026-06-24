-- Track auto-approved architect/engineer steps when students are absent 3+ days

ALTER TABLE land_purchase_engineer_approvals
  ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN NOT NULL DEFAULT FALSE;
