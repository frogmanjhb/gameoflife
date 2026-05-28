-- Migration: Software Engineer cyber attack assignments (spyware pop-up storm, 5/day per town class)
CREATE TABLE IF NOT EXISTS cyber_attack_assignments (
    id SERIAL PRIMARY KEY,
    victim_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attack_type VARCHAR(32) NOT NULL CHECK (attack_type IN ('spyware_popup_storm')),
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    town_class VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    repaired_at TIMESTAMP,
    repair_fee NUMERIC(12, 2),
    repair_requested_at TIMESTAMP,
    repair_paid_at TIMESTAMP,
    paid_by_insurance BOOLEAN NOT NULL DEFAULT false,
    insurance_claim_requested_at TIMESTAMP,
    insurance_claim_reviewed_by INTEGER REFERENCES users(id),
    insurance_claim_reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cyber_attack_victim_active
    ON cyber_attack_assignments(victim_user_id) WHERE repaired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cyber_attack_class_day
    ON cyber_attack_assignments(school_id, town_class, assigned_at);
CREATE INDEX IF NOT EXISTS idx_cyber_attack_pending_repair
    ON cyber_attack_assignments(assigned_by_user_id)
    WHERE repaired_at IS NULL AND repair_requested_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cyber_attack_pending_insurance_claim
    ON cyber_attack_assignments(town_class, school_id)
    WHERE insurance_claim_requested_at IS NOT NULL
      AND repair_requested_at IS NULL
      AND repaired_at IS NULL;
