import { Router, Request, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// Get all plugins (school-scoped: one row per plugin, preferring school override over global)
// For each distinct plugin (by route_path), returns the school-specific row if it exists, else the global row.
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user?.school_id ?? null;
    if (schoolId !== null) {
      // Return one row per route_path: prefer school_id = schoolId, else school_id IS NULL
      const plugins = await database.query(
        `SELECT DISTINCT ON (route_path) *
         FROM plugins
         WHERE school_id IS NULL OR school_id = $1
         ORDER BY route_path, (school_id = $1) DESC NULLS LAST, id`,
        [schoolId]
      );
      return res.json(plugins);
    }
    const plugins = await database.query('SELECT * FROM plugins WHERE school_id IS NULL ORDER BY name');
    res.json(plugins);
  } catch (error) {
    console.error('Failed to fetch plugins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle plugin enabled/disabled (teachers only, school-bound: only affects this school)
// For global plugins, creates/updates a per-school row. For school plugins, updates that row.
router.put('/:id/toggle', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pluginId = parseInt(req.params.id);
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }

    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    if (schoolId === null) {
      return res.status(403).json({ error: 'School context required' });
    }

    const plugin = await database.get('SELECT * FROM plugins WHERE id = $1', [pluginId]);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    // Only allow toggling global plugins or plugins that belong to this school
    if (plugin.school_id != null && plugin.school_id !== schoolId) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const newEnabled = !plugin.enabled;

    if (plugin.school_id === null) {
      // Global plugin: create or update a per-school copy so toggle only affects this school
      const routePath = plugin.route_path || `/${String(plugin.name).toLowerCase().replace(/\s+/g, '-')}`;
      const rows = await database.query(
        `INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (school_id, name) DO UPDATE SET enabled = EXCLUDED.enabled
         RETURNING *`,
        [plugin.name, newEnabled, routePath, plugin.icon || '🔌', plugin.description || '', schoolId]
      );
      return res.json(rows[0]);
    }

    // School-specific plugin: update this row
    await database.run(
      'UPDATE plugins SET enabled = $1 WHERE id = $2',
      [newEnabled, pluginId]
    );
    const updatedPlugin = await database.get('SELECT * FROM plugins WHERE id = $1', [pluginId]);
    res.json(updatedPlugin);
  } catch (error) {
    console.error('Failed to toggle plugin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

