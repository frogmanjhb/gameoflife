import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get town settings (filtered by class if provided, or all for teachers)
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { class: townClass, all } = req.query;
    
    // Teachers can get all towns with ?all=true
    if (all === 'true' && req.user?.role === 'teacher') {
      const towns = await database.query('SELECT * FROM town_settings ORDER BY class');
      return res.json(towns);
    }
    
    // Get specific town by class
    if (townClass && ['6A', '6B', '6C'].includes(townClass as string)) {
      const town = await database.get('SELECT * FROM town_settings WHERE class = $1', [townClass]);
      if (!town) {
        return res.status(404).json({ error: 'Town not found' });
      }
      return res.json(town);
    }
    
    // If user has a class, return their town
    if (req.user?.class && ['6A', '6B', '6C'].includes(req.user.class)) {
      const town = await database.get('SELECT * FROM town_settings WHERE class = $1', [req.user.class]);
      if (town) {
        return res.json(town);
      }
    }
    
    // Default: return first town or empty
    const firstTown = await database.get('SELECT * FROM town_settings ORDER BY class LIMIT 1');
    res.json(firstTown || null);
  } catch (error) {
    console.error('Failed to fetch town settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update town settings (teachers only)
router.put('/settings/:id', 
  authenticateToken, 
  requireRole(['teacher']),
  [
    body('town_name').optional().notEmpty().withMessage('Town name cannot be empty'),
    body('mayor_name').optional(),
    body('tax_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const townId = parseInt(req.params.id);
      if (isNaN(townId)) {
        return res.status(400).json({ error: 'Invalid town ID' });
      }

      const town = await database.get('SELECT * FROM town_settings WHERE id = $1', [townId]);
      if (!town) {
        return res.status(404).json({ error: 'Town not found' });
      }

      const { town_name, mayor_name, tax_rate } = req.body;
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (town_name !== undefined) {
        updates.push(`town_name = $${paramIndex++}`);
        params.push(town_name);
      }
      if (mayor_name !== undefined) {
        updates.push(`mayor_name = $${paramIndex++}`);
        params.push(mayor_name);
      }
      if (tax_rate !== undefined) {
        updates.push(`tax_rate = $${paramIndex++}`);
        params.push(tax_rate);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(townId);

      await database.run(
        `UPDATE town_settings SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      );

      const updated = await database.get('SELECT * FROM town_settings WHERE id = $1', [townId]);
      res.json(updated);
    } catch (error) {
      console.error('Failed to update town settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

