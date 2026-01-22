import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get town rules (filtered by town_class)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { town_class } = req.query;
    
    if (!town_class || !['6A', '6B', '6C'].includes(town_class as string)) {
      return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
    }

    const rules = await database.get(
      'SELECT * FROM town_rules WHERE town_class = $1',
      [town_class]
    );

    // If no rules exist, create an empty entry
    if (!rules) {
      const result = await database.run(
        'INSERT INTO town_rules (town_class, rules) VALUES ($1, NULL) RETURNING id',
        [town_class]
      );
      const newRules = await database.get(
        'SELECT * FROM town_rules WHERE id = $1',
        [result.lastID]
      );
      return res.json(newRules);
    }

    res.json(rules);
  } catch (error) {
    console.error('Failed to fetch town rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update town rules (teachers only)
router.put('/', 
  authenticateToken, 
  requireRole(['teacher']),
  [
    body('town_class').isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C'),
    body('rules').optional()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { town_class, rules } = req.body;

      // Check if rules exist for this town
      const existing = await database.get(
        'SELECT * FROM town_rules WHERE town_class = $1',
        [town_class]
      );

      let updated;

      if (existing) {
        // Update existing rules
        await database.run(
          'UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2',
          [rules || null, town_class]
        );
        updated = await database.get(
          'SELECT * FROM town_rules WHERE town_class = $1',
          [town_class]
        );
      } else {
        // Create new rules entry
        const result = await database.run(
          'INSERT INTO town_rules (town_class, rules) VALUES ($1, $2) RETURNING id',
          [town_class, rules || null]
        );
        updated = await database.get(
          'SELECT * FROM town_rules WHERE id = $1',
          [result.lastID]
        );
      }

      res.json(updated);
    } catch (error) {
      console.error('Failed to update town rules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
