"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get town rules (filtered by town_class, school-scoped)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { town_class } = req.query;
        const schoolId = req.user?.school_id ?? null;
        if (!town_class || !['6A', '6B', '6C'].includes(town_class)) {
            return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
        }
        const rules = await database_prod_1.default.get(schoolId !== null
            ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
            : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL', schoolId !== null ? [town_class, schoolId] : [town_class]);
        // If no rules exist, create an empty entry for this school/class
        if (!rules) {
            if (schoolId !== null) {
                await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules, school_id) VALUES ($1, NULL, $2) RETURNING id', [town_class, schoolId]);
            }
            else {
                await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules) VALUES ($1, NULL) RETURNING id', [town_class]);
            }
            const newRules = await database_prod_1.default.get(schoolId !== null
                ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
                : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL', schoolId !== null ? [town_class, schoolId] : [town_class]);
            return res.json(newRules);
        }
        res.json(rules);
    }
    catch (error) {
        console.error('Failed to fetch town rules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update town rules (teachers only)
router.put('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C'),
    (0, express_validator_1.body)('rules').optional()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { town_class, rules } = req.body;
        const schoolId = req.user?.school_id ?? null;
        // Check if rules exist for this town and school
        const existing = await database_prod_1.default.get(schoolId !== null
            ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
            : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL', schoolId !== null ? [town_class, schoolId] : [town_class]);
        let updated;
        if (existing) {
            await database_prod_1.default.run(schoolId !== null
                ? 'UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2 AND school_id = $3'
                : 'UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2 AND school_id IS NULL', schoolId !== null ? [rules || null, town_class, schoolId] : [rules || null, town_class]);
            updated = await database_prod_1.default.get(schoolId !== null
                ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
                : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL', schoolId !== null ? [town_class, schoolId] : [town_class]);
        }
        else {
            if (schoolId !== null) {
                await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules, school_id) VALUES ($1, $2, $3) RETURNING id', [town_class, rules || null, schoolId]);
            }
            else {
                await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules) VALUES ($1, $2) RETURNING id', [town_class, rules || null]);
            }
            updated = await database_prod_1.default.get(schoolId !== null
                ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
                : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL', schoolId !== null ? [town_class, schoolId] : [town_class]);
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to update town rules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=town-rules.js.map