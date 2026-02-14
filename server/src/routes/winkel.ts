import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

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

// Helper: Get weekly purchase limit from settings (default: 1)
async function getWeeklyPurchaseLimit(): Promise<number> {
  try {
    const setting = await database.get(
      'SELECT setting_value FROM bank_settings WHERE setting_key = $1',
      ['weekly_purchase_limit']
    );
    return setting ? parseInt(setting.setting_value) || 1 : 1;
  } catch (error) {
    console.error('Failed to get weekly purchase limit:', error);
    return 1;
  }
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

// GET /api/winkel/items/all - Get ALL shop items including unavailable (teacher only)
router.get('/items/all', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await database.query(
      'SELECT * FROM shop_items ORDER BY category, name'
    );
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch all shop items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/winkel/items - Create a new shop item (teacher only)
router.post(
  '/items',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').isIn(['consumable', 'privilege', 'profile']).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').optional().trim(),
    body('notes').optional().trim(),
    body('available').optional().isBoolean(),
    body('event_day_only').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, price, description, notes, available = true, event_day_only = false } = req.body;

      const result = await database.query(
        `INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, category, price, description || null, notes || null, available, event_day_only]
      );

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Failed to create shop item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/winkel/items/:id - Update a shop item (teacher only)
router.put(
  '/items/:id',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('category').optional().isIn(['consumable', 'privilege', 'profile']).withMessage('Invalid category'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').optional(),
    body('notes').optional(),
    body('available').optional().isBoolean(),
    body('event_day_only').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, category, price, description, notes, available, event_day_only } = req.body;

      // Check if item exists
      const existingItem = await database.get('SELECT * FROM shop_items WHERE id = $1', [id]);
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (price !== undefined) {
        updates.push(`price = $${paramIndex++}`);
        values.push(price);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description || null);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes || null);
      }
      if (available !== undefined) {
        updates.push(`available = $${paramIndex++}`);
        values.push(available);
      }
      if (event_day_only !== undefined) {
        updates.push(`event_day_only = $${paramIndex++}`);
        values.push(event_day_only);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await database.query(
        `UPDATE shop_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      res.json(result[0]);
    } catch (error) {
      console.error('Failed to update shop item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/winkel/items/:id - Delete a shop item (teacher only)
router.delete(
  '/items/:id',
  authenticateToken,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if item exists
      const existingItem = await database.get('SELECT * FROM shop_items WHERE id = $1', [id]);
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check if item has any purchases
      const purchaseCount = await database.get(
        'SELECT COUNT(*) as count FROM shop_purchases WHERE item_id = $1',
        [id]
      );

      if (parseInt(purchaseCount.count) > 0) {
        // Instead of deleting, just mark as unavailable to preserve purchase history
        await database.run(
          'UPDATE shop_items SET available = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [id]
        );
        return res.json({ 
          message: 'Item has purchase history and was marked as unavailable instead of deleted',
          deleted: false,
          marked_unavailable: true
        });
      }

      // Delete the item if no purchases exist
      await database.run('DELETE FROM shop_items WHERE id = $1', [id]);

      res.json({ message: 'Item deleted successfully', deleted: true });
    } catch (error) {
      console.error('Failed to delete shop item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/winkel/purchases - Get purchase history
router.get('/purchases', authenticateToken, requireTenant, async (req: AuthenticatedRequest, res: Response) => {
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
      // Teachers see only purchases from students in their school
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;
      const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
      const purchaseParams = schoolId !== null ? [schoolId] : [];
      try {
        purchases = await database.query(
          `SELECT 
            sp.id,
            sp.user_id,
            sp.item_id,
            sp.price_paid,
            sp.purchase_date,
            sp.week_start_date,
            sp.created_at,
            COALESCE(sp.paid, false) as paid,
            sp.paid_at,
            sp.paid_by,
            si.name as item_name,
            si.category as item_category,
            si.description as item_description,
            u.username,
            u.first_name,
            u.last_name,
            u.class,
            payer.first_name as paid_by_first_name,
            payer.last_name as paid_by_last_name
           FROM shop_purchases sp
           JOIN shop_items si ON sp.item_id = si.id
           JOIN users u ON sp.user_id = u.id
           LEFT JOIN users payer ON sp.paid_by = payer.id
           WHERE 1=1 ${schoolFilter}
           ORDER BY COALESCE(sp.paid, false) ASC, sp.purchase_date DESC, sp.created_at DESC`,
          purchaseParams
        );
      } catch (queryError) {
        // Fallback query if paid column doesn't exist yet
        console.log('Paid column may not exist, using fallback query');
        purchases = await database.query(
          `SELECT 
            sp.*,
            true as paid,
            NULL as paid_at,
            NULL as paid_by,
            si.name as item_name,
            si.category as item_category,
            si.description as item_description,
            u.username,
            u.first_name,
            u.last_name,
            u.class,
            NULL as paid_by_first_name,
            NULL as paid_by_last_name
           FROM shop_purchases sp
           JOIN shop_items si ON sp.item_id = si.id
           JOIN users u ON sp.user_id = u.id
           WHERE 1=1 ${schoolFilter}
           ORDER BY sp.purchase_date DESC, sp.created_at DESC`,
          purchaseParams
        );
      }
    }

    res.json(purchases);
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/winkel/settings - Get shop settings (weekly purchase limit)
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const weeklyLimit = await getWeeklyPurchaseLimit();
    res.json({ weekly_purchase_limit: weeklyLimit });
  } catch (error) {
    console.error('Failed to get shop settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/winkel/settings - Update shop settings (teacher only)
router.put(
  '/settings',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('weekly_purchase_limit').optional().isInt({ min: 1, max: 10 }).withMessage('Weekly limit must be between 1 and 10'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { weekly_purchase_limit } = req.body;

      if (weekly_purchase_limit !== undefined) {
        // Check if setting exists
        const existing = await database.get(
          'SELECT * FROM bank_settings WHERE setting_key = $1',
          ['weekly_purchase_limit']
        );

        if (existing) {
          await database.run(
            'UPDATE bank_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3',
            [weekly_purchase_limit.toString(), req.user?.id, 'weekly_purchase_limit']
          );
        } else {
          await database.run(
            'INSERT INTO bank_settings (setting_key, setting_value, description, updated_by) VALUES ($1, $2, $3, $4)',
            ['weekly_purchase_limit', weekly_purchase_limit.toString(), 'Maximum purchases per student per week', req.user?.id]
          );
        }
      }

      const newLimit = await getWeeklyPurchaseLimit();
      res.json({ 
        message: 'Shop settings updated successfully',
        weekly_purchase_limit: newLimit 
      });
    } catch (error) {
      console.error('Failed to update shop settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/winkel/can-purchase - Check if student can make a purchase this week
router.get('/can-purchase', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check purchase eligibility' });
    }

    const weekStart = formatDate(getWeekStartDate());
    const weeklyLimit = await getWeeklyPurchaseLimit();
    
    // Count non-profile purchases this week
    const purchaseCount = await database.get(
      `SELECT COUNT(*) as count FROM shop_purchases sp
       JOIN shop_items si ON sp.item_id = si.id
       WHERE sp.user_id = $1 AND sp.week_start_date = $2 AND si.category != 'profile'`,
      [req.user.id, weekStart]
    );

    const currentCount = parseInt(purchaseCount?.count) || 0;
    const remainingPurchases = Math.max(0, weeklyLimit - currentCount);

    res.json({ 
      canPurchase: currentCount < weeklyLimit,
      weeklyLimit,
      purchasesThisWeek: currentCount,
      remainingPurchases
    });
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

      // Profile items have no weekly limit, but check if student already owns this emoji
      const weekStart = formatDate(getWeekStartDate());
      const weeklyLimit = await getWeeklyPurchaseLimit();
      
      if (item.category === 'profile') {
        // Check if student already purchased this emoji
        const existingEmojiPurchase = await database.get(
          'SELECT id FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
          [req.user.id, item_id]
        );

        if (existingEmojiPurchase) {
          return res.status(400).json({ 
            error: 'You already own this emoji!' 
          });
        }
      } else {
        // Check if student has reached weekly purchase limit (non-profile items only)
        const purchaseCount = await database.get(
          `SELECT COUNT(*) as count FROM shop_purchases sp
           JOIN shop_items si ON sp.item_id = si.id
           WHERE sp.user_id = $1 AND sp.week_start_date = $2 AND si.category != 'profile'`,
          [req.user.id, weekStart]
        );

        const currentCount = parseInt(purchaseCount?.count) || 0;
        if (currentCount >= weeklyLimit) {
          const limitText = weeklyLimit === 1 
            ? 'You have already made your weekly purchase.' 
            : `You have reached your weekly limit of ${weeklyLimit} purchases.`;
          return res.status(400).json({ 
            error: `${limitText} Come back next week!` 
          });
        }
      }

      // Check for overdue loans first (this doesn't need to be in the transaction)
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

      // Get or create shop account (do this before the transaction)
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

      const price = parseFloat(item.price);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'Invalid item price' });
      }

      // SECURITY FIX: Use a single database client for proper transaction handling
      // This prevents race conditions where students could exploit timing
      const client = await database.pool.connect();

      try {
        await client.query('BEGIN');

        // SECURITY: Lock the student's account row with FOR UPDATE
        // This prevents concurrent purchases from bypassing balance checks
        const accountResult = await client.query(
          'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
          [req.user.id]
        );
        const account = accountResult.rows[0];

        if (!account) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Account not found' });
        }

        // SECURITY: Validate balance INSIDE the transaction with the locked row
        const accountBalance = parseFloat(account.balance);
        
        if (accountBalance < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: 'Your account has a negative balance. Please clear your debt before making any purchases.' 
          });
        }

        if (accountBalance < price) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Insufficient funds. You need R${price.toFixed(2)} but only have R${accountBalance.toFixed(2)}` 
          });
        }

        // Deduct from student account
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [price, account.id]
        );

        // Add to shop account (lock it too)
        await client.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [price, shopAccount.id]
        );

        // Update shop balance table (always id=1)
        await client.query(
          `UPDATE shop_balance SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
          [price]
        );

        // Also deposit to treasury for the student's class (filtered by school_id)
        const userClass = req.user.class;
        const shopSchoolId = req.user.school_id ?? null;
        if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
          if (shopSchoolId != null) {
            await client.query(
              'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
              [price, userClass, shopSchoolId]
            );
          } else {
            await client.query(
              'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
              [price, userClass]
            );
          }

          // Record treasury transaction
          await client.query(
            'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
            [shopSchoolId, userClass, price, 'deposit', `Shop Purchase: ${item.name} by ${req.user.username}`, req.user.id]
          );
        }

        // Record transaction (from student to shop)
        await client.query(
          `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) 
           VALUES ($1, $2, $3, $4, $5)`,
          [account.id, shopAccount.id, price, 'transfer', `Shop Purchase: ${item.name}`]
        );

        // Record purchase (omit paid to work before migration 023; after migration, DEFAULT false = pending)
        const purchaseDate = formatDate(new Date());
        try {
          await client.query(
            `INSERT INTO shop_purchases (user_id, item_id, price_paid, purchase_date, week_start_date) 
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, item_id, price, purchaseDate, weekStart]
          );
        } catch (insertError: any) {
          // Handle unique constraint violation (race condition)
          if (insertError.code === '23505' || insertError.message?.includes('unique')) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
              error: 'You have already made a purchase this week. Come back next week!' 
            });
          }
          throw insertError;
        }

        // If this is a profile emoji, extract the emoji and update user profile
        if (item.category === 'profile' && item.name) {
          const emojiMatch = item.name.match(/^([\u{1F300}-\u{1F9FF}])/u);
          if (emojiMatch) {
            const emoji = emojiMatch[1];
            await client.query(
              'UPDATE users SET profile_emoji = $1 WHERE id = $2',
              [emoji, req.user.id]
            );
          }
        }

        await client.query('COMMIT');

        // Get updated account balance (outside transaction is fine)
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
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/winkel/balance - Get shop balance (teacher only, tenant context)
router.get('/balance', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
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

// GET /api/winkel/stats - Get shop statistics (teacher only, school-scoped)
router.get('/stats', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null
      ? 'AND (sp.id IS NULL OR u.school_id = $1)'
      : '';
    const params = schoolId !== null ? [schoolId] : [];

    const stats = await database.query(
      `SELECT 
        si.category,
        si.name,
        COUNT(sp.id) as purchase_count,
        COALESCE(SUM(CASE WHEN sp.id IS NOT NULL THEN sp.price_paid END), 0) as total_revenue
       FROM shop_items si
       LEFT JOIN shop_purchases sp ON si.id = sp.item_id
       LEFT JOIN users u ON sp.user_id = u.id
       WHERE 1=1 ${schoolFilter}
       GROUP BY si.id, si.category, si.name
       ORDER BY si.category, purchase_count DESC`,
      params
    );

    const totalPurchasesQ = schoolId !== null
      ? database.get(
          'SELECT COUNT(*) as count FROM shop_purchases sp JOIN users u ON sp.user_id = u.id WHERE u.school_id = $1',
          [schoolId]
        )
      : database.get('SELECT COUNT(*) as count FROM shop_purchases');
    const totalPurchases = await totalPurchasesQ;

    const totalRevenueQ = schoolId !== null
      ? database.get(
          'SELECT COALESCE(SUM(sp.price_paid), 0) as total FROM shop_purchases sp JOIN users u ON sp.user_id = u.id WHERE u.school_id = $1',
          [schoolId]
        )
      : database.get('SELECT COALESCE(SUM(price_paid), 0) as total FROM shop_purchases');
    const totalRevenue = await totalRevenueQ;

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

// POST /api/winkel/change-emoji - Change profile emoji (must be owned)
router.post(
  '/change-emoji',
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
        return res.status(403).json({ error: 'Only students can change profile emoji' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { item_id } = req.body;

      // Get the item
      const item = await database.get(
        'SELECT * FROM shop_items WHERE id = $1 AND category = $2',
        [item_id, 'profile']
      );
      
      if (!item) {
        return res.status(404).json({ error: 'Profile emoji not found' });
      }

      // Check if student owns this emoji
      const purchase = await database.get(
        'SELECT id FROM shop_purchases WHERE user_id = $1 AND item_id = $2',
        [req.user.id, item_id]
      );

      if (!purchase) {
        return res.status(400).json({ error: 'You do not own this emoji. Purchase it from the shop first!' });
      }

      // Extract emoji from item name
      const emojiMatch = item.name.match(/^([\u{1F300}-\u{1F9FF}])/u);
      if (!emojiMatch) {
        return res.status(400).json({ error: 'Invalid emoji item' });
      }

      const emoji = emojiMatch[1];

      // Update user profile
      await database.run(
        'UPDATE users SET profile_emoji = $1 WHERE id = $2',
        [emoji, req.user.id]
      );

      res.json({ 
        message: 'Profile emoji updated successfully!',
        emoji: emoji
      });
    } catch (error) {
      console.error('Change emoji error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/winkel/purchases/:id/paid - Mark a purchase as paid (teacher only, same school)
router.put(
  '/purchases/:id/paid',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      // Check if purchase exists and purchaser is in teacher's school
      const purchase = await database.get(
        `SELECT sp.* FROM shop_purchases sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.id = $1 ${schoolId !== null ? 'AND u.school_id = $2' : ''}`,
        schoolId !== null ? [id, schoolId] : [id]
      );

      if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      if (purchase.paid) {
        return res.status(400).json({ error: 'Purchase is already marked as paid' });
      }

      // Mark as paid
      await database.run(
        'UPDATE shop_purchases SET paid = true, paid_at = CURRENT_TIMESTAMP, paid_by = $1 WHERE id = $2',
        [req.user?.id, id]
      );

      // Get updated purchase with details
      const updatedPurchase = await database.get(
        `SELECT 
          sp.*,
          si.name as item_name,
          si.category as item_category,
          u.username,
          u.first_name,
          u.last_name,
          u.class
         FROM shop_purchases sp
         JOIN shop_items si ON sp.item_id = si.id
         JOIN users u ON sp.user_id = u.id
         WHERE sp.id = $1`,
        [id]
      );

      res.json({
        message: 'Purchase marked as paid',
        purchase: updatedPurchase
      });
    } catch (error) {
      console.error('Failed to mark purchase as paid:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/winkel/owned-emojis - Get all profile emojis owned by student
router.get('/owned-emojis', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view owned emojis' });
    }

    const ownedEmojis = await database.query(
      `SELECT 
        si.id,
        si.name,
        si.description,
        sp.purchase_date
       FROM shop_purchases sp
       JOIN shop_items si ON sp.item_id = si.id
       WHERE sp.user_id = $1 AND si.category = 'profile'
       ORDER BY sp.purchase_date DESC`,
      [req.user.id]
    );

    res.json(ownedEmojis);
  } catch (error) {
    console.error('Failed to fetch owned emojis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
