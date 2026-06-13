"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const jobs_1 = require("./jobs");
const doctor_illness_1 = require("../domain/doctor-illness");
const insurance_1 = require("../domain/insurance");
const doctor_reputation_1 = require("../domain/doctor-reputation");
const router = (0, express_1.Router)();
function hasDoctorJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('doctor');
}
function illnessPayload(type) {
    const meta = doctor_illness_1.DOCTOR_ILLNESS_META[type];
    return { illness_type: type, illness_name: meta.name, illness_description: meta.description };
}
async function countDoctorAssignmentsToday(doctorId) {
    const row = await database_prod_1.default.get(`SELECT COUNT(*)::int AS count FROM doctor_illness_assignments
     WHERE assigned_by_user_id = $1
     AND assigned_at >= (${doctor_illness_1.DOCTOR_ILLNESS_DAY_START_SQL})`, [doctorId]);
    return row?.count ?? 0;
}
async function awardDoctorXp(doctorUserId, xp) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [doctorUserId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + xp;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await database_prod_1.default.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, doctorUserId]);
    return { new_level: newLevel > currentLevel ? newLevel : null };
}
router.get('/doctor-status', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access doctor illness tools' });
        }
        const userId = req.user.id;
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [userId]);
        if (!user || !hasDoctorJob(user.job_name)) {
            return res.status(403).json({ error: 'Only Junior Doctors can assign illnesses' });
        }
        if (!req.user.class) {
            return res.status(400).json({ error: 'You must belong to a town class to assign illnesses' });
        }
        try {
            await database_prod_1.default.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
        }
        catch {
            const reputation = await (0, doctor_reputation_1.getDoctorReputationIfDoctor)(userId, user.job_name);
            return res.json({
                remaining_today: doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT,
                daily_limit: doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT,
                cure_fee: doctor_illness_1.DOCTOR_CURE_FEE,
                cure_approve_xp: doctor_illness_1.DOCTOR_CURE_APPROVE_XP,
                pending_cures: [],
                recent_assignments: [],
                reputation,
            });
        }
        await (0, doctor_illness_1.expireUntreatedIllnesses)();
        const used = await countDoctorAssignmentsToday(userId);
        const recent = await database_prod_1.default.query(`SELECT a.id, a.illness_type, a.assigned_at, a.cured_at, a.cure_requested_at,
              p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.assigned_by_user_id = $1
         AND a.assigned_at >= (${doctor_illness_1.DOCTOR_ILLNESS_DAY_START_SQL})
       ORDER BY a.assigned_at DESC
       LIMIT 10`, [userId]);
        const pendingCures = await database_prod_1.default.query(`SELECT a.id, a.illness_type, a.cure_fee, a.cure_requested_at,
              p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.assigned_by_user_id = $1
         AND a.cured_at IS NULL
         AND a.cure_requested_at IS NOT NULL
       ORDER BY a.cure_requested_at ASC`, [userId]);
        const reputation = await (0, doctor_reputation_1.getDoctorReputationIfDoctor)(userId, user.job_name);
        res.json({
            remaining_today: Math.max(0, doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT - used),
            daily_limit: doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT,
            cure_fee: doctor_illness_1.DOCTOR_CURE_FEE,
            cure_approve_xp: doctor_illness_1.DOCTOR_CURE_APPROVE_XP,
            reputation,
            pending_cures: pendingCures.map((r) => {
                const type = r.illness_type;
                const meta = doctor_illness_1.DOCTOR_ILLNESS_META[type];
                return {
                    id: r.id,
                    patient_username: r.patient_username,
                    patient_display_name: r.patient_display_name,
                    illness_type: type,
                    illness_name: meta?.name ?? type,
                    cure_fee: parseFloat(String(r.cure_fee ?? doctor_illness_1.DOCTOR_CURE_FEE)),
                    cure_requested_at: r.cure_requested_at,
                };
            }),
            recent_assignments: recent.map((r) => {
                const type = r.illness_type;
                const meta = doctor_illness_1.DOCTOR_ILLNESS_META[type];
                let illness_status = 'sick';
                if (r.cured_at)
                    illness_status = 'recovered';
                else if (r.cure_requested_at)
                    illness_status = 'pending_cure';
                return {
                    id: r.id,
                    patient_username: r.patient_username,
                    patient_display_name: r.patient_display_name,
                    illness_type: type,
                    illness_name: meta?.name ?? type,
                    assigned_at: r.assigned_at,
                    cured_at: r.cured_at,
                    illness_status,
                };
            }),
        });
    }
    catch (error) {
        console.error('Doctor illness doctor-status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/assign', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can assign illnesses' });
        }
        const doctorId = req.user.id;
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [doctorId]);
        if (!user || !hasDoctorJob(user.job_name)) {
            return res.status(403).json({ error: 'Only Junior Doctors can assign illnesses' });
        }
        if (!req.user.class) {
            return res.status(400).json({ error: 'You must belong to a town class to assign illnesses' });
        }
        try {
            await database_prod_1.default.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
        }
        catch {
            return res.status(503).json({ error: 'Illness feature not available yet. Please try again later.' });
        }
        await (0, doctor_illness_1.expireUntreatedIllnesses)();
        const schoolId = req.user.school_id ?? null;
        const townClass = req.user.class;
        const used = await countDoctorAssignmentsToday(doctorId);
        if (used >= doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT) {
            return res.status(400).json({
                error: `You have already made ${doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT} students sick today. Try again tomorrow.`,
            });
        }
        const patient = await database_prod_1.default.get(`SELECT u.id, u.username,
              COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.username) AS display_name
       FROM users u
       WHERE u.role = 'student'
         AND u.status = 'approved'
         AND u.class = $1
         AND u.school_id IS NOT DISTINCT FROM $2
         AND u.id != $3
         AND NOT EXISTS (
           SELECT 1 FROM doctor_illness_assignments d
           WHERE d.patient_user_id = u.id AND d.cured_at IS NULL
         )
       ORDER BY RANDOM()
       LIMIT 1`, [townClass, schoolId, doctorId]);
        if (!patient) {
            return res.status(400).json({
                error: 'No eligible classmates available (everyone may already be sick or pending approval).',
            });
        }
        const illnessType = (0, doctor_illness_1.pickRandomIllnessType)();
        const inserted = await database_prod_1.default.query(`INSERT INTO doctor_illness_assignments
         (patient_user_id, assigned_by_user_id, illness_type, school_id, town_class, cure_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, assigned_at`, [patient.id, doctorId, illnessType, schoolId, townClass, doctor_illness_1.DOCTOR_CURE_FEE]);
        const row = inserted[0];
        const meta = doctor_illness_1.DOCTOR_ILLNESS_META[illnessType];
        const reputation = await (0, doctor_reputation_1.decrementDoctorReputationOnAssign)(doctorId);
        res.json({
            success: true,
            assignment: {
                id: row.id,
                patient_username: patient.username,
                patient_display_name: patient.display_name,
                illness_type: illnessType,
                illness_name: meta.name,
                assigned_at: row.assigned_at,
            },
            remaining_today: Math.max(0, doctor_illness_1.DOCTOR_ILLNESS_DAILY_LIMIT - used - 1),
            reputation,
        });
    }
    catch (error) {
        console.error('Doctor illness assign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/my-status', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can check illness status' });
        }
        try {
            await database_prod_1.default.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
        }
        catch {
            return res.json({ active: false });
        }
        await (0, doctor_illness_1.expireUntreatedIllnesses)(req.user.id);
        const row = await database_prod_1.default.get(`SELECT illness_type, assigned_at, cure_requested_at, cure_fee, insurance_claim_requested_at,
              d.username AS doctor_username,
              COALESCE(NULLIF(TRIM(CONCAT(d.first_name, ' ', d.last_name)), ''), d.username) AS doctor_display_name
       FROM doctor_illness_assignments a
       JOIN users d ON d.id = a.assigned_by_user_id
       WHERE a.patient_user_id = $1 AND a.cured_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`, [req.user.id]);
        if (!row) {
            return res.json({ active: false });
        }
        const assignedAt = new Date(row.assigned_at).getTime();
        const seeDoctorAt = assignedAt + doctor_illness_1.DOCTOR_SEE_DOCTOR_DELAY_MS;
        const now = Date.now();
        const pendingCure = !!row.cure_requested_at;
        const pendingInsuranceClaim = !!row.insurance_claim_requested_at && !pendingCure;
        const canPayForCure = !pendingCure && !pendingInsuranceClaim && now >= seeDoctorAt;
        const type = row.illness_type;
        const cureFee = parseFloat(String(row.cure_fee ?? doctor_illness_1.DOCTOR_CURE_FEE));
        const healthInsuranceCoversClinic = await (0, insurance_1.hasActiveApprovedHealthInsurance)(req.user.id);
        const brokerRequired = await (0, insurance_1.classRequiresBrokerApproval)(req.user.school_id ?? null, req.user.class ?? null, req.user.id);
        const expiresAtMs = assignedAt + doctor_illness_1.DOCTOR_ILLNESS_UNTREATED_EXPIRY_MS;
        const showNaturalRecovery = !pendingCure && !pendingInsuranceClaim;
        const secondsUntilNaturalRecovery = showNaturalRecovery && now < expiresAtMs
            ? Math.ceil((expiresAtMs - now) / 1000)
            : 0;
        res.json({
            active: true,
            pending_cure: pendingCure,
            pending_insurance_claim: pendingInsuranceClaim,
            cure_fee: cureFee,
            health_insurance_covers_clinic: healthInsuranceCoversClinic,
            insurance_broker_required: brokerRequired && healthInsuranceCoversClinic,
            doctor_username: row.doctor_username,
            doctor_display_name: row.doctor_display_name,
            assigned_at: row.assigned_at,
            see_doctor_available_at: new Date(seeDoctorAt).toISOString(),
            can_see_doctor: canPayForCure,
            seconds_until_see_doctor: pendingCure || pendingInsuranceClaim || canPayForCure ? 0 : Math.ceil((seeDoctorAt - now) / 1000),
            expires_at: showNaturalRecovery ? new Date(expiresAtMs).toISOString() : undefined,
            seconds_until_natural_recovery: showNaturalRecovery ? secondsUntilNaturalRecovery : undefined,
            ...illnessPayload(type),
        });
    }
    catch (error) {
        console.error('Doctor illness my-status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/see-doctor', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can visit the doctor' });
        }
        try {
            await database_prod_1.default.query('SELECT 1 FROM doctor_illness_assignments LIMIT 1');
        }
        catch {
            return res.status(503).json({ error: 'Illness feature not available yet. Please try again later.' });
        }
        await (0, doctor_illness_1.expireUntreatedIllnesses)(req.user.id);
        const row = await database_prod_1.default.get(`SELECT a.id, a.illness_type, a.assigned_at, a.cure_requested_at, a.cure_fee,
              a.insurance_claim_requested_at, a.assigned_by_user_id, d.username AS doctor_username
       FROM doctor_illness_assignments a
       JOIN users d ON d.id = a.assigned_by_user_id
       WHERE a.patient_user_id = $1 AND a.cured_at IS NULL
       ORDER BY a.assigned_at DESC LIMIT 1`, [req.user.id]);
        if (!row) {
            return res.status(400).json({ error: 'You are not currently sick' });
        }
        if (row.cure_requested_at) {
            return res.status(400).json({ error: 'You have already paid. Waiting for your doctor to approve the cure.' });
        }
        if (row.insurance_claim_requested_at) {
            return res.status(400).json({
                error: 'Your insurance claim is waiting for your town insurance manager to approve payment.',
            });
        }
        const seeDoctorAt = new Date(row.assigned_at).getTime() + doctor_illness_1.DOCTOR_SEE_DOCTOR_DELAY_MS;
        if (Date.now() < seeDoctorAt) {
            const secondsLeft = Math.ceil((seeDoctorAt - Date.now()) / 1000);
            return res.status(400).json({
                error: `The clinic opens in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}.`,
            });
        }
        const cureFee = parseFloat(String(row.cure_fee ?? doctor_illness_1.DOCTOR_CURE_FEE));
        const hasHealthInsurance = await (0, insurance_1.hasActiveApprovedHealthInsurance)(req.user.id);
        const brokerRequired = await (0, insurance_1.classRequiresBrokerApproval)(req.user.school_id ?? null, req.user.class ?? null, req.user.id);
        if (hasHealthInsurance && brokerRequired) {
            await database_prod_1.default.query(`UPDATE doctor_illness_assignments
         SET insurance_claim_requested_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [row.id]);
            return res.json({
                success: true,
                cured: false,
                pending_cure: false,
                pending_insurance_claim: true,
                cure_fee: cureFee,
                paid_by_insurance: false,
                doctor_username: row.doctor_username,
                illness_type: row.illness_type,
            });
        }
        const doctorAccount = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [row.assigned_by_user_id]);
        if (!doctorAccount) {
            return res.status(400).json({ error: 'Doctor bank account not found for payment' });
        }
        const { netAmount: doctorClinicPay, reputation: doctorRep } = await (0, doctor_reputation_1.resolveDoctorNetEarnings)(row.assigned_by_user_id, cureFee);
        const clinicWithheld = Math.round((cureFee - doctorClinicPay) * 100) / 100;
        const townClass = req.user.class ?? null;
        const schoolId = req.user.school_id ?? null;
        if (hasHealthInsurance) {
            await (0, insurance_1.payHealthInsuranceClinicClaim)(database_prod_1.default, row.id, row.assigned_by_user_id, doctorAccount.id, cureFee, row.illness_type, { townClass, schoolId });
        }
        else {
            const patientAccount = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
            if (!patientAccount) {
                return res.status(400).json({ error: 'Bank account not found for payment' });
            }
            const patientBalance = parseFloat(patientAccount.balance);
            if (isNaN(patientBalance) || patientBalance < cureFee) {
                return res.status(400).json({ error: `Insufficient funds. Clinic fee is $${cureFee.toFixed(2)}.` });
            }
            await database_prod_1.default.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [cureFee, patientAccount.id]);
            await database_prod_1.default.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [doctorClinicPay, doctorAccount.id]);
            if (clinicWithheld > 0 && townClass) {
                if (schoolId != null) {
                    await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [clinicWithheld, townClass, schoolId]);
                }
                else {
                    await database_prod_1.default.query('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [clinicWithheld, townClass]);
                }
                await database_prod_1.default.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
           VALUES ($1, $2, $3, 'deposit', $4, $5)`, [
                    schoolId,
                    townClass,
                    clinicWithheld,
                    'Doctor clinic reputation withholding',
                    row.assigned_by_user_id,
                ]);
            }
            const transferDescription = doctorRep.penalty_label && clinicWithheld > 0
                ? `Clinic visit fee — ${row.illness_type} (doctor paid R${doctorClinicPay.toFixed(2)} after reputation penalty)`
                : `Clinic visit fee — ${row.illness_type} (awaiting doctor approval)`;
            await database_prod_1.default.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, 'transfer', $4)`, [patientAccount.id, doctorAccount.id, doctorClinicPay, transferDescription]);
            await database_prod_1.default.query(`UPDATE doctor_illness_assignments
         SET cure_requested_at = CURRENT_TIMESTAMP,
             cure_paid_at = CURRENT_TIMESTAMP,
             paid_by_insurance = FALSE
         WHERE id = $1`, [row.id]);
        }
        res.json({
            success: true,
            cured: false,
            pending_cure: true,
            pending_insurance_claim: false,
            cure_fee: cureFee,
            paid_by_insurance: hasHealthInsurance,
            doctor_username: row.doctor_username,
            illness_type: row.illness_type,
        });
    }
    catch (error) {
        console.error('Doctor illness see-doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/approve-cure/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can approve cures' });
        }
        const doctorId = req.user.id;
        const user = await database_prod_1.default.get(`SELECT u.*, j.name AS job_name FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1`, [doctorId]);
        if (!user || !hasDoctorJob(user.job_name)) {
            return res.status(403).json({ error: 'Only Junior Doctors can approve cures' });
        }
        const assignmentId = parseInt(String(req.params.id), 10);
        if (!assignmentId || Number.isNaN(assignmentId)) {
            return res.status(400).json({ error: 'Invalid assignment id' });
        }
        const row = await database_prod_1.default.get(`SELECT a.*, p.username AS patient_username,
              COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), p.username) AS patient_display_name
       FROM doctor_illness_assignments a
       JOIN users p ON p.id = a.patient_user_id
       WHERE a.id = $1`, [assignmentId]);
        if (!row) {
            return res.status(404).json({ error: 'Cure request not found' });
        }
        if (row.assigned_by_user_id !== doctorId) {
            return res.status(403).json({ error: 'You can only approve cures for patients you treated' });
        }
        if (row.cured_at) {
            return res.status(400).json({ error: 'This patient has already been cured' });
        }
        if (!row.cure_requested_at) {
            return res.status(400).json({ error: 'This patient has not paid for a clinic visit yet' });
        }
        await database_prod_1.default.query(`UPDATE doctor_illness_assignments SET cured_at = CURRENT_TIMESTAMP WHERE id = $1`, [assignmentId]);
        const xpResult = await awardDoctorXp(doctorId, doctor_illness_1.DOCTOR_CURE_APPROVE_XP);
        res.json({
            success: true,
            cured: true,
            patient_username: row.patient_username,
            patient_display_name: row.patient_display_name,
            experience_points: doctor_illness_1.DOCTOR_CURE_APPROVE_XP,
            new_level: xpResult.new_level,
        });
    }
    catch (error) {
        console.error('Doctor illness approve-cure error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=doctor-illness.js.map