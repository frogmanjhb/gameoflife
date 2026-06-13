import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  enrichOwnedParcel,
  hasFinancialManagerJob,
  isTownClass,
  calculateAppreciatedValue,
  calculateWeeklyRent,
  canCollectWeeklyRent,
} from '../domain/landProperty';
import {
  LAND_SALE_FM_RESUBMIT_COOLDOWN_HOURS,
  landSaleResubmitBlockedByCooldown,
} from '../domain/landPurchaseApproval';

const router = Router();

async function syncParcelAppreciation(parcelId: number): Promise<void> {
  const parcel = await database.get(
    'SELECT id, purchase_price, value, purchased_at FROM land_parcels WHERE id = $1 AND owner_id IS NOT NULL',
    [parcelId]
  );
  if (!parcel?.purchased_at) return;
  const purchasePrice = Number(parcel.purchase_price ?? parcel.value);
  const currentValue = calculateAppreciatedValue(purchasePrice, parcel.purchased_at);
  if (currentValue !== Number(parcel.value)) {
    await database.run(
      'UPDATE land_parcels SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [currentValue, parcelId]
    );
  }
}

async function getUserWithJob(userId: number) {
  return database.get(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON j.id = u.job_id
     WHERE u.id = $1`,
    [userId]
  );
}

async function assertFinancialManager(userId: number, schoolId: number | null, townClass: string) {
  const user = await getUserWithJob(userId);
  if (!user || !hasFinancialManagerJob(user.job_name)) {
    return { ok: false as const, error: 'Only the Financial Manager can perform this action' };
  }
  if ((user.school_id ?? null) !== schoolId) {
    return { ok: false as const, error: 'Financial Manager must be in the same school' };
  }
  if (user.class !== townClass) {
    return { ok: false as const, error: 'Financial Manager must be in the same town class as the property' };
  }
  return { ok: true as const, user };
}

function saleRequestSelect() {
  return `
    SELECT lsr.*,
           lp.grid_code AS parcel_grid_code,
           lp.biome_type AS parcel_biome_type,
           lp.town_class AS parcel_town_class,
           seller.username AS seller_username,
           seller.first_name AS seller_first_name,
           seller.last_name AS seller_last_name,
           buyer.username AS buyer_username,
           buyer.first_name AS buyer_first_name,
           buyer.last_name AS buyer_last_name,
           fm.username AS fm_reviewer_username
    FROM land_sale_requests lsr
    JOIN land_parcels lp ON lp.id = lsr.parcel_id
    JOIN users seller ON seller.id = lsr.seller_id
    JOIN users buyer ON buyer.id = lsr.buyer_id
    LEFT JOIN users fm ON fm.id = lsr.fm_reviewed_by
  `;
}

// POST /collect-rent/:parcelId — owner collects 5% weekly rental income
router.post('/collect-rent/:parcelId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parcelId = parseInt(req.params.parcelId, 10);
    if (Number.isNaN(parcelId)) {
      return res.status(400).json({ error: 'Invalid parcel ID' });
    }

    const parcel = await database.get('SELECT * FROM land_parcels WHERE id = $1', [parcelId]);
    if (!parcel || parcel.owner_id !== req.user!.id) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    if (!parcel.purchased_at) {
      return res.status(400).json({ error: 'Parcel has no purchase date' });
    }

    await syncParcelAppreciation(parcelId);
    const refreshed = await database.get('SELECT * FROM land_parcels WHERE id = $1', [parcelId]);
    const purchasePrice = Number(refreshed.purchase_price ?? refreshed.value);
    const currentValue = calculateAppreciatedValue(purchasePrice, refreshed.purchased_at);

    if (!canCollectWeeklyRent(refreshed.purchased_at, refreshed.last_rent_collected_at)) {
      return res.status(400).json({ error: 'Rental income already collected for this week' });
    }

    const rentAmount = calculateWeeklyRent(currentValue);
    const account = await database.get('SELECT id FROM accounts WHERE user_id = $1', [req.user!.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await database.run(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [rentAmount, req.user!.id]
    );
    await database.run(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, rentAmount, `Land rental income: Plot ${refreshed.grid_code}`]
    );
    await database.run(
      'UPDATE land_parcels SET last_rent_collected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [parcelId]
    );

    res.json({
      message: 'Rental income collected',
      amount: rentAmount,
      parcel: enrichOwnedParcel({ ...refreshed, value: currentValue }),
    });
  } catch (error) {
    console.error('Failed to collect rent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sale-requests — seller lists property for sale to another student
router.post('/sale-requests',
  authenticateToken,
  body('parcel_id').isInt({ min: 1 }),
  body('buyer_id').isInt({ min: 1 }),
  body('sale_price').isFloat({ min: 0.01 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { parcel_id, buyer_id, sale_price } = req.body;
      if (buyer_id === req.user!.id) {
        return res.status(400).json({ error: 'Cannot sell to yourself' });
      }

      const parcel = await database.get('SELECT * FROM land_parcels WHERE id = $1', [parcel_id]);
      if (!parcel || parcel.owner_id !== req.user!.id) {
        return res.status(404).json({ error: 'Parcel not found or you are not the owner' });
      }

      const userClass = req.user!.class;
      if (isTownClass(userClass) && parcel.town_class !== userClass) {
        return res.status(403).json({ error: 'You can only sell land in your town' });
      }

      const buyer = await database.get(
        `SELECT id, class, school_id FROM users WHERE id = $1 AND role = 'student'`,
        [buyer_id]
      );
      if (!buyer) {
        return res.status(404).json({ error: 'Buyer not found' });
      }
      if ((buyer.school_id ?? null) !== (req.user!.school_id ?? null)) {
        return res.status(400).json({ error: 'Buyer must be in your school' });
      }
      if (buyer.class !== parcel.town_class) {
        return res.status(400).json({ error: 'Buyer must be in the same town class' });
      }

      const activeSale = await database.get(
        `SELECT id FROM land_sale_requests WHERE parcel_id = $1 AND status IN ('pending_fm', 'pending_buyer')`,
        [parcel_id]
      );
      if (activeSale) {
        return res.status(400).json({ error: 'This parcel already has an active sale request' });
      }

      if (await landSaleResubmitBlockedByCooldown(database, parcel_id, req.user!.id, buyer_id)) {
        return res.status(400).json({
          error: `This sale was recently denied by the Financial Manager. Wait ${LAND_SALE_FM_RESUBMIT_COOLDOWN_HOURS} hours before re-listing to the same buyer.`,
        });
      }

      const schoolId = req.user!.school_id ?? null;
      const result = schoolId !== null
        ? await database.get(
            `INSERT INTO land_sale_requests (parcel_id, seller_id, buyer_id, sale_price, school_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [parcel_id, req.user!.id, buyer_id, sale_price, schoolId]
          )
        : await database.get(
            `INSERT INTO land_sale_requests (parcel_id, seller_id, buyer_id, sale_price)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [parcel_id, req.user!.id, buyer_id, sale_price]
          );

      const request = await database.get(`${saleRequestSelect()} WHERE lsr.id = $1`, [result.id]);
      res.status(201).json({ message: 'Sale request submitted to Financial Manager', request });
    } catch (error) {
      console.error('Failed to create sale request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /sale-requests — seller, buyer, or FM views
router.get('/sale-requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.query;
    const schoolId = req.user!.school_id ?? null;
    let requests;

    if (role === 'fm') {
      const fmCheck = await getUserWithJob(req.user!.id);
      if (!fmCheck || !hasFinancialManagerJob(fmCheck.job_name)) {
        return res.status(403).json({ error: 'Only Financial Managers can view approval queue' });
      }
      requests = schoolId !== null
        ? await database.query(
            `${saleRequestSelect()}
             WHERE lsr.status = 'pending_fm' AND lsr.school_id = $1 AND lp.town_class = $2
             ORDER BY lsr.created_at ASC`,
            [schoolId, fmCheck.class]
          )
        : await database.query(
            `${saleRequestSelect()}
             WHERE lsr.status = 'pending_fm' AND lsr.school_id IS NULL AND lp.town_class = $1
             ORDER BY lsr.created_at ASC`,
            [fmCheck.class]
          );
    } else if (role === 'buyer') {
      requests = await database.query(
        `${saleRequestSelect()} WHERE lsr.buyer_id = $1 ORDER BY lsr.created_at DESC`,
        [req.user!.id]
      );
    } else {
      requests = await database.query(
        `${saleRequestSelect()} WHERE lsr.seller_id = $1 ORDER BY lsr.created_at DESC`,
        [req.user!.id]
      );
    }

    res.json(requests);
  } catch (error) {
    console.error('Failed to fetch sale requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /sale-requests/:id/fm-review — Financial Manager approves or denies
router.put('/sale-requests/:id/fm-review',
  authenticateToken,
  body('status').isIn(['pending_buyer', 'denied']),
  body('denial_reason').optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestId = parseInt(req.params.id, 10);
      const { status, denial_reason } = req.body;

      const sale = await database.get(
        `${saleRequestSelect()} WHERE lsr.id = $1`,
        [requestId]
      );
      if (!sale || sale.status !== 'pending_fm') {
        return res.status(404).json({ error: 'Sale request not found or already processed' });
      }

      const fmAuth = await assertFinancialManager(
        req.user!.id,
        sale.school_id ?? null,
        sale.parcel_town_class
      );
      if (!fmAuth.ok) {
        return res.status(403).json({ error: fmAuth.error });
      }
      if (sale.seller_id === req.user!.id || sale.buyer_id === req.user!.id) {
        return res.status(403).json({ error: 'You cannot review a sale you are party to' });
      }
      if (sale.fm_reviewed_by != null) {
        return res.status(400).json({ error: 'This sale request has already been reviewed' });
      }

      if (status === 'denied') {
        await database.run(
          `UPDATE land_sale_requests
           SET status = 'denied', fm_reviewed_by = $1, fm_reviewed_at = CURRENT_TIMESTAMP,
               denial_reason = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [req.user!.id, denial_reason || 'Denied by Financial Manager', requestId]
        );
      } else {
        await database.run(
          `UPDATE land_sale_requests
           SET status = 'pending_buyer', fm_reviewed_by = $1, fm_reviewed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [req.user!.id, requestId]
        );
      }

      const updated = await database.get(`${saleRequestSelect()} WHERE lsr.id = $1`, [requestId]);
      res.json({ message: `Sale request ${status === 'denied' ? 'denied' : 'sent to buyer'}`, request: updated });
    } catch (error) {
      console.error('Failed to review sale request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /sale-requests/:id/accept — buyer accepts and completes purchase
router.put('/sale-requests/:id/accept', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const client = await database.pool.connect();
  try {
    const requestId = parseInt(req.params.id, 10);
    const sale = await database.get(`${saleRequestSelect()} WHERE lsr.id = $1`, [requestId]);
    if (!sale || sale.status !== 'pending_buyer') {
      return res.status(404).json({ error: 'Sale request not available for acceptance' });
    }
    if (sale.buyer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the buyer can accept this sale' });
    }

    const parcel = await database.get('SELECT * FROM land_parcels WHERE id = $1', [sale.parcel_id]);
    if (!parcel || parcel.owner_id !== sale.seller_id) {
      return res.status(400).json({ error: 'Property is no longer owned by the seller' });
    }

    const salePrice = Number(sale.sale_price);

    await client.query('BEGIN');

    const buyerAccountRes = await client.query(
      'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
      [sale.buyer_id]
    );
    const sellerAccountRes = await client.query(
      'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
      [sale.seller_id]
    );
    const buyerAccount = buyerAccountRes.rows[0];
    const sellerAccount = sellerAccountRes.rows[0];
    if (!buyerAccount || !sellerAccount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buyer or seller account not found' });
    }

    const buyerBalance = parseFloat(buyerAccount.balance);
    if (buyerBalance < salePrice) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance to complete purchase' });
    }

    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [salePrice, buyerAccount.id]
    );
    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [salePrice, sellerAccount.id]
    );
    await client.query(
      `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, 'transfer', $4)`,
      [buyerAccount.id, sellerAccount.id, salePrice, `Land sale: Plot ${sale.parcel_grid_code}`]
    );
    await client.query(
      `UPDATE land_parcels
       SET owner_id = $1, value = $2, purchase_price = $2,
           purchased_at = CURRENT_TIMESTAMP, last_rent_collected_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [sale.buyer_id, salePrice, sale.parcel_id]
    );
    await client.query(
      `UPDATE land_sale_requests
       SET status = 'completed', buyer_responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [requestId]
    );

    await client.query('COMMIT');

    const updated = await database.get(`${saleRequestSelect()} WHERE lsr.id = $1`, [requestId]);
    res.json({ message: 'Property purchase completed', request: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to accept sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /sale-requests/:id/cancel — seller cancels pending FM review
router.put('/sale-requests/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const sale = await database.get('SELECT * FROM land_sale_requests WHERE id = $1', [requestId]);
    if (!sale || sale.seller_id !== req.user!.id) {
      return res.status(404).json({ error: 'Sale request not found' });
    }
    if (sale.status !== 'pending_fm') {
      return res.status(400).json({ error: 'Only pending sale requests can be cancelled' });
    }

    await database.run(
      `UPDATE land_sale_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [requestId]
    );
    res.json({ message: 'Sale request cancelled' });
  } catch (error) {
    console.error('Failed to cancel sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
