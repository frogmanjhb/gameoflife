import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all disasters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if disasters table exists
    try {
      await database.query('SELECT 1 FROM disasters LIMIT 1');
    } catch (tableError) {
      return res.json([]);
    }

    const disasters = await database.query(`
      SELECT 
        d.*,
        u.username as created_by_username
      FROM disasters d
      LEFT JOIN users u ON d.created_by = u.id
      ORDER BY d.is_active DESC, d.created_at DESC
    `);

    res.json(disasters);
  } catch (error) {
    console.error('Get disasters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent disaster events
router.get('/events/recent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if disaster_events table exists
    try {
      await database.query('SELECT 1 FROM disaster_events LIMIT 1');
    } catch (tableError) {
      return res.json([]);
    }

    const events = await database.query(`
      SELECT 
        de.*,
        d.name as disaster_name,
        d.icon as disaster_icon,
        u.username as triggered_by_username
      FROM disaster_events de
      LEFT JOIN disasters d ON de.disaster_id = d.id
      LEFT JOIN users u ON de.triggered_by = u.id
      ORDER BY de.triggered_at DESC
      LIMIT 20
    `);

    res.json(events);
  } catch (error) {
    console.error('Get recent disaster events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new disaster type (teachers only)
router.post('/', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, icon, effect_type, effect_value, affects_all_classes, target_class } = req.body;

    if (!name || !effect_type || effect_value === undefined) {
      return res.status(400).json({ error: 'Name, effect_type, and effect_value are required' });
    }

    // Validate effect_type
    const validEffectTypes = ['balance_percentage', 'balance_fixed', 'salary_percentage'];
    if (!validEffectTypes.includes(effect_type)) {
      return res.status(400).json({ error: 'Invalid effect_type' });
    }

    const result = await database.query(`
      INSERT INTO disasters (name, description, icon, effect_type, effect_value, affects_all_classes, target_class, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description || null, icon || '🌪️', effect_type, effect_value, affects_all_classes !== false, target_class || null, req.user?.id]);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a disaster (teachers only)
router.put('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disasterId = parseInt(req.params.id);
    const { name, description, icon, effect_type, effect_value, affects_all_classes, target_class, is_active } = req.body;

    if (isNaN(disasterId)) {
      return res.status(400).json({ error: 'Invalid disaster ID' });
    }

    // Check if disaster exists
    const existing = await database.get('SELECT * FROM disasters WHERE id = $1', [disasterId]);
    if (!existing) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    const result = await database.query(`
      UPDATE disasters 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        effect_type = COALESCE($4, effect_type),
        effect_value = COALESCE($5, effect_value),
        affects_all_classes = COALESCE($6, affects_all_classes),
        target_class = $7,
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [name, description, icon, effect_type, effect_value, affects_all_classes, target_class, is_active, disasterId]);

    res.json(result[0]);
  } catch (error) {
    console.error('Update disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a disaster (teachers only)
router.delete('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disasterId = parseInt(req.params.id);

    if (isNaN(disasterId)) {
      return res.status(400).json({ error: 'Invalid disaster ID' });
    }

    await database.run('DELETE FROM disasters WHERE id = $1', [disasterId]);

    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    console.error('Delete disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger a disaster (teachers only) - applies the effect to students
router.post('/:id/trigger', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disasterId = parseInt(req.params.id);
    const { target_class, notes } = req.body;

    if (isNaN(disasterId)) {
      return res.status(400).json({ error: 'Invalid disaster ID' });
    }

    // Get disaster details
    const disaster = await database.get('SELECT * FROM disasters WHERE id = $1', [disasterId]);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    // Determine which students to affect
    let studentsQuery = `
      SELECT u.id, a.id as account_id, a.balance
      FROM users u
      JOIN accounts a ON u.id = a.user_id
      WHERE u.role = 'student'
    `;
    const queryParams: any[] = [];

    // Use provided target_class or disaster's target_class
    const effectiveTargetClass = target_class || disaster.target_class;
    if (effectiveTargetClass && !disaster.affects_all_classes) {
      studentsQuery += ' AND u.class = $1';
      queryParams.push(effectiveTargetClass);
    }

    const students = await database.query(studentsQuery, queryParams);

    let totalImpact = 0;
    let affectedCount = 0;

    // Apply the disaster effect to each student
    for (const student of students) {
      let impactAmount = 0;

      switch (disaster.effect_type) {
        case 'balance_percentage':
          // Effect value is a percentage (e.g., -10 means reduce by 10%)
          impactAmount = (student.balance * disaster.effect_value) / 100;
          break;
        case 'balance_fixed':
          // Effect value is a fixed amount (e.g., -100 means reduce by R100)
          impactAmount = disaster.effect_value;
          break;
        case 'salary_percentage':
          // This would be applied during salary payment, log it for now
          impactAmount = 0;
          break;
      }

      if (impactAmount !== 0) {
        // Calculate new balance (don't go below 0)
        const newBalance = Math.max(0, student.balance + impactAmount);
        const actualImpact = newBalance - student.balance;

        // Update student balance
        await database.run(
          'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, student.account_id]
        );

        // Record transaction
        await database.run(`
          INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
          VALUES ($1, NULL, $2, 'fine', $3)
        `, [student.account_id, Math.abs(actualImpact), `Disaster: ${disaster.name}`]);

        totalImpact += actualImpact;
        affectedCount++;
      }
    }

    // Record the disaster event
    await database.run(`
      INSERT INTO disaster_events (disaster_id, triggered_by, target_class, affected_students, total_impact, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [disasterId, req.user?.id, effectiveTargetClass || null, affectedCount, totalImpact, notes || null]);

    res.json({
      message: `Disaster "${disaster.name}" triggered successfully`,
      affected_students: affectedCount,
      total_impact: totalImpact,
      disaster_name: disaster.name
    });
  } catch (error) {
    console.error('Trigger disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle disaster active status (teachers only)
router.put('/:id/toggle', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disasterId = parseInt(req.params.id);

    if (isNaN(disasterId)) {
      return res.status(400).json({ error: 'Invalid disaster ID' });
    }

    // Get current state
    const disaster = await database.get('SELECT * FROM disasters WHERE id = $1', [disasterId]);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    // Toggle active state
    const newActive = !disaster.is_active;
    await database.run(
      'UPDATE disasters SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [newActive, disasterId]
    );

    const updatedDisaster = await database.get('SELECT * FROM disasters WHERE id = $1', [disasterId]);
    res.json(updatedDisaster);
  } catch (error) {
    console.error('Toggle disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
