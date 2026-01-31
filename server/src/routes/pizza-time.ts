import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Helper: Validate town class
function isValidTownClass(townClass: any): townClass is '6A' | '6B' | '6C' {
  return ['6A', '6B', '6C'].includes(townClass);
}

const TOWN_CLASSES: ('6A' | '6B' | '6C')[] = ['6A', '6B', '6C'];

// Helper: Fetch full status for one class
async function getPizzaTimeStatusForClass(userClass: '6A' | '6B' | '6C') {
  let pizzaTime = await database.get(
    'SELECT * FROM pizza_time WHERE class = $1',
    [userClass]
  );

  if (!pizzaTime) {
    await database.run(
      'INSERT INTO pizza_time (class, is_active, current_fund, goal_amount) VALUES ($1, $2, $3, $4)',
      [userClass, false, 0.00, 100000.00]
    );
    pizzaTime = await database.get(
      'SELECT * FROM pizza_time WHERE class = $1',
      [userClass]
    );
  }

  const donations = await database.query(
    `SELECT 
      ptd.*,
      u.username,
      u.first_name,
      u.last_name
     FROM pizza_time_donations ptd
     JOIN users u ON ptd.user_id = u.id
     WHERE ptd.pizza_time_id = $1
     ORDER BY ptd.created_at DESC
     LIMIT 20`,
    [pizzaTime.id]
  );

  const donationCount = await database.get(
    'SELECT COUNT(*) as count FROM pizza_time_donations WHERE pizza_time_id = $1',
    [pizzaTime.id]
  );

  const donationHistory = await database.query(
    `SELECT 
      DATE(created_at) as date,
      SUM(amount) as daily_total,
      COUNT(*) as donation_count
     FROM pizza_time_donations
     WHERE pizza_time_id = $1
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [pizzaTime.id]
  );

  return {
    ...pizzaTime,
    current_fund: parseFloat(pizzaTime.current_fund),
    goal_amount: parseFloat(pizzaTime.goal_amount),
    donations: donations.map((d: any) => ({
      ...d,
      amount: parseFloat(d.amount)
    })),
    donation_count: parseInt(donationCount.count),
    donation_history: donationHistory.map((h: any) => ({
      ...h,
      daily_total: parseFloat(h.daily_total),
      donation_count: parseInt(h.donation_count)
    }))
  };
}

// GET /api/pizza-time/status/all - Get pizza time status for ALL classes (teachers only)
router.get('/status/all', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    try {
      await database.query('SELECT 1 FROM pizza_time LIMIT 1');
    } catch (tableError: any) {
      if (tableError.message && tableError.message.includes('does not exist')) {
        return res.status(503).json({ error: 'Pizza Time feature is not available yet.' });
      }
      throw tableError;
    }

    const allStatus = await Promise.all(
      TOWN_CLASSES.map(async (c) => getPizzaTimeStatusForClass(c))
    );

    res.json({
      classes: TOWN_CLASSES.reduce((acc, cls, i) => {
        acc[cls] = allStatus[i];
        return acc;
      }, {} as Record<string, any>)
    });
  } catch (error) {
    console.error('Failed to fetch all pizza time status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pizza-time/status - Get pizza time status for current user's class
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // For teachers, allow specifying a class via query param, or use their class if they have one
    let userClass: '6A' | '6B' | '6C' | null = null;
    
    if (req.user.role === 'teacher') {
      const requestedClass = req.query.class as string;
      if (requestedClass && isValidTownClass(requestedClass)) {
        userClass = requestedClass;
      } else if (req.user.class && isValidTownClass(req.user.class)) {
        userClass = req.user.class;
      } else {
        // Default to 6A for teachers without a class
        userClass = '6A';
      }
    } else {
      // For students, must have a valid class
      if (!req.user.class || !isValidTownClass(req.user.class)) {
        console.log('⚠️ Student has no valid class:', { 
          username: req.user.username, 
          class: req.user.class,
          role: req.user.role 
        });
        return res.status(400).json({ 
          error: 'You do not have a valid class assigned. Please contact your teacher to assign you to a class (6A, 6B, or 6C).',
          details: `Your current class value: ${req.user.class || 'null'}`
        });
      }
      userClass = req.user.class;
    }

    // Check if pizza_time table exists
    try {
      await database.query('SELECT 1 FROM pizza_time LIMIT 1');
    } catch (tableError: any) {
      if (tableError.message && tableError.message.includes('does not exist')) {
        return res.status(503).json({ error: 'Pizza Time feature is not available yet. The server needs to run migrations. Please contact your administrator or restart the server.' });
      }
      throw tableError;
    }

    const status = await getPizzaTimeStatusForClass(userClass);
    res.json(status);
  } catch (error) {
    console.error('Failed to fetch pizza time status:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    res.status(500).json({ error: `Internal server error: ${errorMessage}` });
  }
});

// POST /api/pizza-time/donate - Make a donation (students only)
router.post(
  '/donate',
  authenticateToken,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can make donations' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount } = req.body;
      const donationAmount = parseFloat(amount);

      // Validate donation amount is one of the allowed values
      const allowedAmounts = [500, 1000, 2000, 5000];
      if (!allowedAmounts.includes(donationAmount)) {
        return res.status(400).json({ 
          error: 'Invalid donation amount. Allowed amounts: 500, 1000, 2000, 5000' 
        });
      }

      // Students must have a valid class
      const userClass = req.user.class;
      if (!userClass || !isValidTownClass(userClass)) {
        console.log('⚠️ Student has no valid class for donation:', { 
          username: req.user.username, 
          class: req.user.class 
        });
        return res.status(400).json({ 
          error: 'You do not have a valid class assigned. Please contact your teacher to assign you to a class (6A, 6B, or 6C).',
          details: `Your current class value: ${userClass || 'null'}`
        });
      }

      // Get pizza time for this class
      let pizzaTime = await database.get(
        'SELECT * FROM pizza_time WHERE class = $1',
        [userClass]
      );

      if (!pizzaTime) {
        return res.status(404).json({ error: 'Pizza time not found for this class' });
      }

      // Check if pizza time is active
      if (!pizzaTime.is_active) {
        return res.status(400).json({ error: 'Pizza time is not currently active' });
      }

      // Get student's account
      const account = await database.get(
        'SELECT * FROM accounts WHERE user_id = $1',
        [req.user.id]
      );

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check sufficient balance
      const accountBalance = parseFloat(account.balance);
      if (accountBalance < donationAmount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      // Start transaction
      const client = await database.pool.connect();
      try {
        await client.query('BEGIN');

        // Deduct from student's account
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [donationAmount, account.id]
        );

        // Record transaction
        await client.query(
          'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
          [account.id, donationAmount, 'withdrawal', `Pizza Time donation - R${donationAmount.toFixed(2)}`]
        );

        // Add to pizza time fund
        await client.query(
          'UPDATE pizza_time SET current_fund = current_fund + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [donationAmount, pizzaTime.id]
        );

        // Record donation
        await client.query(
          'INSERT INTO pizza_time_donations (pizza_time_id, user_id, amount) VALUES ($1, $2, $3)',
          [pizzaTime.id, req.user.id, donationAmount]
        );

        await client.query('COMMIT');

        // Get updated pizza time
        const updatedPizzaTime = await database.get(
          'SELECT * FROM pizza_time WHERE id = $1',
          [pizzaTime.id]
        );

        res.json({
          message: 'Donation successful!',
          pizza_time: {
            ...updatedPizzaTime,
            current_fund: parseFloat(updatedPizzaTime.current_fund),
            goal_amount: parseFloat(updatedPizzaTime.goal_amount)
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to process donation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/pizza-time/toggle - Toggle pizza time active status (teachers only)
router.post(
  '/toggle',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('class').notEmpty().withMessage('Class is required'),
    body('is_active').isBoolean().withMessage('is_active must be a boolean'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { class: townClass, is_active } = req.body;

      if (!isValidTownClass(townClass)) {
        return res.status(400).json({ error: 'Invalid town class' });
      }

      // Get or create pizza time for this class
      let pizzaTime = await database.get(
        'SELECT * FROM pizza_time WHERE class = $1',
        [townClass]
      );

      if (!pizzaTime) {
        await database.run(
          'INSERT INTO pizza_time (class, is_active, current_fund, goal_amount) VALUES ($1, $2, $3, $4)',
          [townClass, is_active, 0.00, 100000.00]
        );
        pizzaTime = await database.get(
          'SELECT * FROM pizza_time WHERE class = $1',
          [townClass]
        );
      } else {
        await database.run(
          'UPDATE pizza_time SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2',
          [is_active, townClass]
        );
        pizzaTime = await database.get(
          'SELECT * FROM pizza_time WHERE class = $1',
          [townClass]
        );
      }

      res.json({
        message: `Pizza time ${is_active ? 'activated' : 'deactivated'} for ${townClass}`,
        pizza_time: {
          ...pizzaTime,
          current_fund: parseFloat(pizzaTime.current_fund),
          goal_amount: parseFloat(pizzaTime.goal_amount)
        }
      });
    } catch (error) {
      console.error('Failed to toggle pizza time:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/pizza-time/reset - Reset pizza time fund (teachers only)
router.post(
  '/reset',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('class').notEmpty().withMessage('Class is required'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { class: townClass } = req.body;

      if (!isValidTownClass(townClass)) {
        return res.status(400).json({ error: 'Invalid town class' });
      }

      // Reset fund to 0
      await database.run(
        'UPDATE pizza_time SET current_fund = 0.00, updated_at = CURRENT_TIMESTAMP WHERE class = $1',
        [townClass]
      );

      // Optionally delete donation history (commented out - keep history)
      // await database.run('DELETE FROM pizza_time_donations WHERE pizza_time_id = (SELECT id FROM pizza_time WHERE class = $1)', [townClass]);

      const pizzaTime = await database.get(
        'SELECT * FROM pizza_time WHERE class = $1',
        [townClass]
      );

      res.json({
        message: `Pizza time fund reset for ${townClass}`,
        pizza_time: {
          ...pizzaTime,
          current_fund: parseFloat(pizzaTime.current_fund),
          goal_amount: parseFloat(pizzaTime.goal_amount)
        }
      });
    } catch (error) {
      console.error('Failed to reset pizza time:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
