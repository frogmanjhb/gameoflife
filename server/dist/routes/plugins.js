"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all plugins (public, but filtered by enabled status if needed)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const plugins = await database_prod_1.default.query('SELECT * FROM plugins ORDER BY name');
        res.json(plugins);
    }
    catch (error) {
        console.error('Failed to fetch plugins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Toggle plugin enabled/disabled (teachers only)
router.put('/:id/toggle', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const pluginId = parseInt(req.params.id);
        if (isNaN(pluginId)) {
            return res.status(400).json({ error: 'Invalid plugin ID' });
        }
        // Get current state
        const plugin = await database_prod_1.default.get('SELECT * FROM plugins WHERE id = $1', [pluginId]);
        if (!plugin) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        // Toggle enabled state
        const newEnabled = !plugin.enabled;
        await database_prod_1.default.run('UPDATE plugins SET enabled = $1 WHERE id = $2', [newEnabled, pluginId]);
        const updatedPlugin = await database_prod_1.default.get('SELECT * FROM plugins WHERE id = $1', [pluginId]);
        res.json(updatedPlugin);
    }
    catch (error) {
        console.error('Failed to toggle plugin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=plugins.js.map