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
// Get town rules (filtered by town_class)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { town_class } = req.query;
        if (!town_class || !['6A', '6B', '6C'].includes(town_class)) {
            return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
        }
        const rules = await database_prod_1.default.get('SELECT * FROM town_rules WHERE town_class = $1', [town_class]);
        // If no rules exist, create an empty entry
        if (!rules) {
            const result = await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules) VALUES ($1, NULL) RETURNING id', [town_class]);
            const newRules = await database_prod_1.default.get('SELECT * FROM town_rules WHERE id = $1', [result.lastID]);
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
        // Check if rules exist for this town
        const existing = await database_prod_1.default.get('SELECT * FROM town_rules WHERE town_class = $1', [town_class]);
        let updated;
        if (existing) {
            // Update existing rules
            await database_prod_1.default.run('UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2', [rules || null, town_class]);
            updated = await database_prod_1.default.get('SELECT * FROM town_rules WHERE town_class = $1', [town_class]);
        }
        else {
            // Create new rules entry
            const result = await database_prod_1.default.run('INSERT INTO town_rules (town_class, rules) VALUES ($1, $2) RETURNING id', [town_class, rules || null]);
            updated = await database_prod_1.default.get('SELECT * FROM town_rules WHERE id = $1', [result.lastID]);
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