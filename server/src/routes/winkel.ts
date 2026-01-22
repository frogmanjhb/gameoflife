import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Helper: Get Monday of the current week
function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Set to start of day
  return d;
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/winkel/items - Get all shop items
router.get('/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await database.query(
      'SELECT * FROM shop_items WHERE available = true ORDER BY category, price'
    );
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch shop items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/winkel/purchases - Get purchase history
router.get('/purchases', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    let purchases;

    if (req.user.role === 'student') {
      // Students see only their own purchases
      purchases = await database.query(
        `SELECT 
          sp.*,
          si.name as item_name,
          si.category as item_category,
          si.description as item_description
         FROM shop_purchases sp
         JOIN shop_items si ON sp.item_id = si.id
         WHERE sp.user_id = $1
         ORDER BY sp.purchase_date DESC, sp.created_at DESC`,
        [req.user.id]
      );
    } else {
      // Teachers see all purchases
      purchases = await database.query(
        `SELECT 
          sp.*,
          si.name as item_name,
          si.category as item_category,
          si.description as item_description,
          u.username,
          u.first_name,
          u.last_name,
          u.class
         FROM shop_purchases sp
         JOIN shop_items si ON sp.item_id = si.id
         JOIN users u ON sp.user_id = u.id
         ORDER BY sp.purchase_date DESC, sp.created_at DESC`
      );
    }

    res.json(purchases);
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/winkel/can-purchase - Check if student can make a purchase this week
router.get('/can-purchase', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check purchase eligibility' });
    }

    const weekStart = formatDate(getWeekStartDate());
    
    const existingPurchase = await database.get(
      'SELECT id FROM shop_purchases WHERE user_id = $1 AND week_start_date = $2',
      [req.user.id, weekStart]
    );

    res.json({ canPurchase: !existingPurchase });
  } catch (error) {
    console.error('Failed to check purchase eligibility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/winkel/purchase - Make a purchase
router.post(
  '/purchase',
  authenticateToken,
  [
    body('item_id').isInt().withMessage('Item ID must be an integer'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can make purchases' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { item_id } = req.body;

      // Get the item
      const item = await database.get('SELECT * FROM shop_items WHERE id = $1 AND available = true', [item_id]);
      if (!item) {
        return res.status(404).json({ error: 'Item not found or not available' });
      }

      // Check if item is event-day only (for future implementation)
      // For now, we'll allow all items

      // Check if student has already made a purchase this week
      const weekStart = formatDate(getWeekStartDate());
      const existingPurchase = await database.get(
        'SELECT id FROM shop_purchases WHERE user_id = $1 AND week_start_date = $2',
        [req.user.id, weekStart]
      );

      if (existingPurchase) {
        return res.status(400).json({ 
          error: 'You have already made a purchase this week. Come back next week!' 
        });
      }

      // Get student's account
      const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check if student has enough balance
      const price = parseFloat(item.price);
      if (parseFloat(account.balance) < price) {
        return res.status(400).json({ 
          error: `Insufficient funds. You need R${price.toFixed(2)} but only have R${parseFloat(account.balance).toFixed(2)}` 
        });
      }

      // Check if student can make transactions (negative balance or overdue loan check)
      // This uses the same logic as transfers
      const accountBalance = parseFloat(account.balance);
      if (accountBalance < 0) {
        return res.status(400).json({ 
          error: 'Your account has a negative balance. Please clear your debt before making any purchases.' 
        });
      }

      const activeLoan = await database.get(
        `SELECT id, monthly_payment, due_date, outstanding_balance 
         FROM loans 
         WHERE borrower_id = $1 AND status = 'active' AND due_date IS NOT NULL AND due_date < CURRENT_DATE`,
        [req.user.id]
      );
      
      if (activeLoan) {
        return res.status(400).json({ 
          error: 'You have an overdue loan payment. Please make your loan payment before making any purchases.' 
        });
      }

      // Get or create shop account
      let shopAccount = await database.get(
        `SELECT a.* FROM accounts a 
         JOIN users u ON a.user_id = u.id 
         WHERE u.username = 'shop_system' LIMIT 1`
      );

      if (!shopAccount) {
        // Create shop system user and account if it doesn't exist
        const shopUser = await database.get('SELECT id FROM users WHERE username = $1', ['shop_system']);
        let shopUserId;
        
        if (!shopUser) {
          const newShopUserResult = await database.query(
            `INSERT INTO users (username, password_hash, role, first_name, last_name) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            ['shop_system', 'system_account', 'teacher', 'Shop', 'System']
          );
          shopUserId = newShopUserResult[0]?.id;
        } else {
          shopUserId = shopUser.id;
        }

        if (shopUserId) {
          const accountNumber = `SHOP${Date.now()}`;
          await database.run(
            `INSERT INTO accounts (user_id, account_number, balance) 
             VALUES ($1, $2, $3)`,
            [shopUserId, accountNumber, 0.00]
          );
          // Get the newly created account
          const accounts = await database.query(
            `SELECT a.* FROM accounts a WHERE a.user_id = $1`,
            [shopUserId]
          );
          shopAccount = accounts[0];
        }
      }

      // Start transaction
      await database.run('BEGIN');

      try {
        // Deduct from student account
        await database.run(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [price, account.id]
        );

        // Add to shop account
        await database.run(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [price, shopAccount.id]
        );

        // Update shop balance table (always id=1)
        await database.run(
          `UPDATE shop_balance SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
          [price]
        );

        // Record transaction (from student to shop)
        await database.run(
          `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) 
           VALUES ($1, $2, $3, $4, $5)`,
          [account.id, shopAccount.id, price, 'transfer', `Shop Purchase: ${item.name}`]
        );

        // Record purchase
        const purchaseDate = formatDate(new Date());
        try {
          await database.run(
            `INSERT INTO shop_purchases (user_id, item_id, price_paid, purchase_date, week_start_date) 
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, item_id, price, purchaseDate, weekStart]
          );
        } catch (insertError: any) {
          // Handle unique constraint violation (race condition)
          if (insertError.code === '23505' || insertError.message?.includes('unique')) {
            await database.run('ROLLBACK');
            return res.status(400).json({ 
              error: 'You have already made a purchase this week. Come back next week!' 
            });
          }
          throw insertError;
        }

        await database.run('COMMIT');

        // Get updated account balance
        const updatedAccount = await database.get('SELECT balance FROM accounts WHERE id = $1', [account.id]);

        res.json({
          message: `Successfully purchased ${item.name}!`,
          purchase: {
            item_name: item.name,
            price_paid: price,
            purchase_date: purchaseDate,
            new_balance: parseFloat(updatedAccount.balance)
          }
        });
      } catch (error) {
        await database.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/winkel/balance - Get shop balance (teacher only)
router.get('/balance', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopBalance = await database.get('SELECT balance FROM shop_balance WHERE id = 1');
    res.json({ 
      balance: shopBalance ? parseFloat(shopBalance.balance) : 0.00 
    });
  } catch (error) {
    console.error('Failed to fetch shop balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/winkel/stats - Get shop statistics (teacher only)
router.get('/stats', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await database.query(
      `SELECT 
        si.category,
        si.name,
        COUNT(sp.id) as purchase_count,
        SUM(sp.price_paid) as total_revenue
       FROM shop_items si
       LEFT JOIN shop_purchases sp ON si.id = sp.item_id
       GROUP BY si.id, si.category, si.name
       ORDER BY si.category, purchase_count DESC`
    );

    const totalPurchases = await database.get(
      'SELECT COUNT(*) as count FROM shop_purchases'
    );

    const totalRevenue = await database.get(
      'SELECT COALESCE(SUM(price_paid), 0) as total FROM shop_purchases'
    );

    const shopBalance = await database.get('SELECT balance FROM shop_balance WHERE id = 1');

    res.json({
      item_stats: stats,
      total_purchases: parseInt(totalPurchases.count),
      total_revenue: parseFloat(totalRevenue.total),
      shop_balance: shopBalance ? parseFloat(shopBalance.balance) : 0.00
    });
  } catch (error) {
    console.error('Failed to fetch shop stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
