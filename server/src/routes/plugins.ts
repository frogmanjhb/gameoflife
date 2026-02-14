import { Router, Request, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all plugins (school-scoped: global plugins + plugins for user's school)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user?.school_id ?? null;
    const plugins = schoolId !== null
      ? await database.query(
          'SELECT * FROM plugins WHERE school_id IS NULL OR school_id = $1 ORDER BY name',
          [schoolId]
        )
      : await database.query('SELECT * FROM plugins ORDER BY name');
    res.json(plugins);
  } catch (error) {
    console.error('Failed to fetch plugins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle plugin enabled/disabled (teachers only, plugin must be global or teacher's school)
router.put('/:id/toggle', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pluginId = parseInt(req.params.id);
    
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }

    const schoolId = req.user?.school_id ?? null;
    // Get current state - only allow toggle if plugin is global or belongs to teacher's school
    const plugin = await database.get('SELECT * FROM plugins WHERE id = $1', [pluginId]);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    if (schoolId !== null && plugin.school_id != null && plugin.school_id !== schoolId) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Toggle enabled state
    const newEnabled = !plugin.enabled;
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

