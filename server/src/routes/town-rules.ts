import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get town rules (filtered by town_class, school-scoped)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { town_class } = req.query;
    const schoolId = req.user?.school_id ?? null;
    
    if (!town_class || !['6A', '6B', '6C'].includes(town_class as string)) {
      return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
    }

    const rules = await database.get(
      schoolId !== null
        ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
        : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL',
      schoolId !== null ? [town_class, schoolId] : [town_class]
    );

    // If no rules exist, create an empty entry for this school/class
    if (!rules) {
      if (schoolId !== null) {
        await database.run(
          'INSERT INTO town_rules (town_class, rules, school_id) VALUES ($1, NULL, $2) RETURNING id',
          [town_class, schoolId]
        );
      } else {
        await database.run(
          'INSERT INTO town_rules (town_class, rules) VALUES ($1, NULL) RETURNING id',
          [town_class]
        );
      }
      const newRules = await database.get(
        schoolId !== null
          ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
          : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL',
        schoolId !== null ? [town_class, schoolId] : [town_class]
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
      const schoolId = req.user?.school_id ?? null;

      // Check if rules exist for this town and school
      const existing = await database.get(
        schoolId !== null
          ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
          : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL',
        schoolId !== null ? [town_class, schoolId] : [town_class]
      );

      let updated;

      if (existing) {
        await database.run(
          schoolId !== null
            ? 'UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2 AND school_id = $3'
            : 'UPDATE town_rules SET rules = $1, updated_at = CURRENT_TIMESTAMP WHERE town_class = $2 AND school_id IS NULL',
          schoolId !== null ? [rules || null, town_class, schoolId] : [rules || null, town_class]
        );
        updated = await database.get(
          schoolId !== null
            ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
            : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL',
          schoolId !== null ? [town_class, schoolId] : [town_class]
        );
      } else {
        if (schoolId !== null) {
          await database.run(
            'INSERT INTO town_rules (town_class, rules, school_id) VALUES ($1, $2, $3) RETURNING id',
            [town_class, rules || null, schoolId]
          );
        } else {
          await database.run(
            'INSERT INTO town_rules (town_class, rules) VALUES ($1, $2) RETURNING id',
            [town_class, rules || null]
          );
        }
        updated = await database.get(
          schoolId !== null
            ? 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id = $2'
            : 'SELECT * FROM town_rules WHERE town_class = $1 AND school_id IS NULL',
          schoolId !== null ? [town_class, schoolId] : [town_class]
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
