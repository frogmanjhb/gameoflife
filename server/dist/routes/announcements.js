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
// Get announcements (filtered by town_class if provided, school-scoped)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { town_class } = req.query;
        const schoolId = req.user?.school_id ?? null;
        let query = `
      SELECT a.*, u.username as created_by_username
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE (a.school_id = $1 OR (a.school_id IS NULL AND $1 IS NULL))
    `;
        const params = [schoolId];
        if (town_class && ['6A', '6B', '6C'].includes(town_class)) {
            query += ' AND a.town_class = $2';
            params.push(town_class);
        }
        query += ' ORDER BY a.created_at DESC';
        const announcements = await database_prod_1.default.query(query, params);
        res.json(announcements);
    }
    catch (error) {
        console.error('Failed to fetch announcements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create announcement (teachers only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('town_class').isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C'),
    (0, express_validator_1.body)('background_color').optional().isIn(['blue', 'green', 'yellow', 'red', 'purple']).withMessage('Invalid color'),
    (0, express_validator_1.body)('enable_wiggle').optional().isBoolean().withMessage('enable_wiggle must be boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { title, content, town_class, background_color = 'blue', enable_wiggle = false } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const schoolId = req.user?.school_id ?? null;
        const result = await database_prod_1.default.run('INSERT INTO announcements (title, content, town_class, created_by, background_color, enable_wiggle, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [title, content, town_class, req.user.id, background_color, enable_wiggle, schoolId]);
        const announcement = await database_prod_1.default.get('SELECT a.*, u.username as created_by_username FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.id = $1', [result.lastID]);
        res.status(201).json(announcement);
    }
    catch (error) {
        console.error('Failed to create announcement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update announcement (teachers only)
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Title cannot be empty'),
    (0, express_validator_1.body)('content').optional().notEmpty().withMessage('Content cannot be empty'),
    (0, express_validator_1.body)('town_class').optional().isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C'),
    (0, express_validator_1.body)('background_color').optional().isIn(['blue', 'green', 'yellow', 'red', 'purple']).withMessage('Invalid color'),
    (0, express_validator_1.body)('enable_wiggle').optional().isBoolean().withMessage('enable_wiggle must be boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const announcementId = parseInt(req.params.id);
        if (isNaN(announcementId)) {
            return res.status(400).json({ error: 'Invalid announcement ID' });
        }
        const schoolId = req.user?.school_id ?? null;
        const announcement = await database_prod_1.default.get('SELECT * FROM announcements WHERE id = $1', [announcementId]);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        if (schoolId !== null && (announcement.school_id == null || announcement.school_id !== schoolId)) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        const { title, content, town_class, background_color, enable_wiggle } = req.body;
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(title);
        }
        if (content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            params.push(content);
        }
        if (town_class !== undefined) {
            updates.push(`town_class = $${paramIndex++}`);
            params.push(town_class);
        }
        if (background_color !== undefined) {
            updates.push(`background_color = $${paramIndex++}`);
            params.push(background_color);
        }
        if (enable_wiggle !== undefined) {
            updates.push(`enable_wiggle = $${paramIndex++}`);
            params.push(enable_wiggle);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(announcementId);
        await database_prod_1.default.run(`UPDATE announcements SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        const updated = await database_prod_1.default.get('SELECT a.*, u.username as created_by_username FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.id = $1', [announcementId]);
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to update announcement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete announcement (teachers only, same school)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        if (isNaN(announcementId)) {
            return res.status(400).json({ error: 'Invalid announcement ID' });
        }
        const schoolId = req.user?.school_id ?? null;
        const announcement = await database_prod_1.default.get('SELECT * FROM announcements WHERE id = $1', [announcementId]);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        if (schoolId !== null && (announcement.school_id == null || announcement.school_id !== schoolId)) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        await database_prod_1.default.run('DELETE FROM announcements WHERE id = $1', [announcementId]);
        res.json({ message: 'Announcement deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete announcement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=announcements.js.map