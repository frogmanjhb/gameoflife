import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { BiomeType, RiskLevel, LandParcel, LandPurchaseRequest } from '../types';
import { enrichOwnedParcel, calculateAppreciatedValue } from '../domain/landProperty';
import { calculateTotalPurchaseCost, isLandEngineerJob } from '../domain/landPurchaseApproval';
import landEconomyRouter from './land-economy';
import landPurchaseApprovalRouter, {
  getRequiredLandEngineers,
  enrichPurchaseRequestWithEngineers,
} from './land-purchase-approval';

const router = Router();
router.use(landEconomyRouter);
router.use(landPurchaseApprovalRouter);

// Biome configuration with pros/cons and base values (prices set so land is meaningful vs salaries)
const BIOME_CONFIG: Record<BiomeType, { 
  baseValue: number; 
  risk: RiskLevel; 
  pros: string[]; 
  cons: string[];
}> = {
  'Savanna': {
    baseValue: 75000,
    risk: 'medium',
    pros: ['Good grazing land', 'Wildlife tourism potential', 'Moderate rainfall'],
    cons: ['Seasonal droughts', 'Fire risk', 'Limited water sources']
  },
  'Grassland': {
    baseValue: 56250,
    risk: 'low',
    pros: ['Excellent farming potential', 'Easy to develop', 'Stable ecosystem'],
    cons: ['Soil erosion risk', 'Limited shade', 'Overgrazing concerns']
  },
  'Forest': {
    baseValue: 131250,
    risk: 'medium',
    pros: ['Rich biodiversity', 'Timber resources', 'Carbon credits potential'],
    cons: ['Fire risk', 'Clearing restrictions', 'Difficult access']
  },
  'Fynbos': {
    baseValue: 135000,
    risk: 'high',
    pros: ['Unique biodiversity', 'Eco-tourism value', 'Protected species habitat'],
    cons: ['Fire-dependent ecosystem', 'Strict conservation laws', 'Limited development']
  },
  'Nama Karoo': {
    baseValue: 58595,
    risk: 'medium',
    pros: ['Sheep farming suited', 'Low land cost', 'Unique landscape'],
    cons: ['Very dry climate', 'Limited water', 'Remote location']
  },
  'Succulent Karoo': {
    baseValue: 37970,
    risk: 'high',
    pros: ['Rare plant species', 'Research value', 'Mining potential'],
    cons: ['Extreme temperatures', 'Water scarcity', 'Conservation restrictions']
  },
  'Desert': {
    baseValue: 67500,
    risk: 'high',
    pros: ['Solar energy potential', 'Low land price', 'Mineral deposits'],
    cons: ['Extreme conditions', 'No water', 'Uninhabitable without infrastructure']
  },
  'Thicket': {
    baseValue: 93750,
    risk: 'low',
    pros: ['Carbon storage', 'Game farming potential', 'Drought resistant'],
    cons: ['Dense vegetation', 'Clearing needed', 'Elephant damage risk']
  },
  'Indian Ocean Coastal Belt': {
    baseValue: 180000,
    risk: 'medium',
    pros: ['High property value', 'Tourism potential', 'Port access'],
    cons: ['Coastal erosion', 'Cyclone risk', 'High development costs']
  }
};

const TOWN_CLASSES = ['6A', '6B', '6C'] as const;
type TownClass = typeof TOWN_CLASSES[number];

function isTownClass(value: unknown): value is TownClass {
  return typeof value === 'string' && (TOWN_CLASSES as readonly string[]).includes(value);
}

function resolveTownClass(req: AuthenticatedRequest, queryTownClass?: unknown): TownClass | null {
  if (req.user!.role === 'student') {
    const userClass = req.user!.class;
    return isTownClass(userClass) ? userClass : null;
  }
  if (isTownClass(queryTownClass)) {
    return queryTownClass;
  }
  return '6A';
}

function townClassOffset(townClass: TownClass): number {
  if (townClass === '6B') return 2;
  if (townClass === '6C') return 4;
  return 0;
}

function rowToLetterCode(row: number): string {
  if (row < 26) {
    return String.fromCharCode(65 + row); // A-Z
  }
  const first = Math.floor(row / 26) - 1;
  const second = row % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// Helper: Convert letter code back to row index
function letterCodeToRow(code: string): number {
  if (code.length === 1) {
    return code.charCodeAt(0) - 65;
  }
  const first = (code.charCodeAt(0) - 65 + 1) * 26;
  const second = code.charCodeAt(1) - 65;
  return first + second;
}

// Helper: Generate grid code from row and column
function generateGridCode(row: number, col: number): string {
  return `${rowToLetterCode(row)}${col + 1}`;
}

// GET /api/land/parcels - Get all parcels (with optional viewport filtering)
router.get('/parcels', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { minRow, maxRow, minCol, maxCol, owned, biome, town_class } = req.query;
    const schoolId = req.user?.school_id ?? null;
    const townClass = resolveTownClass(req, town_class);
    if (!townClass) {
      return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
    }
    
    let query = `
      SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM land_parcels lp
      LEFT JOIN users u ON lp.owner_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (schoolId !== null) {
      query += ` AND lp.school_id = $${paramIndex++}`;
      params.push(schoolId);
    } else {
      query += ' AND lp.school_id IS NULL';
    }

    query += ` AND lp.town_class = $${paramIndex++}`;
    params.push(townClass);

    // Viewport filtering for performance
    if (minRow !== undefined && maxRow !== undefined) {
      query += ` AND lp.row_index >= $${paramIndex++} AND lp.row_index <= $${paramIndex++}`;
      params.push(parseInt(minRow as string), parseInt(maxRow as string));
    }
    if (minCol !== undefined && maxCol !== undefined) {
      query += ` AND lp.col_index >= $${paramIndex++} AND lp.col_index <= $${paramIndex++}`;
      params.push(parseInt(minCol as string), parseInt(maxCol as string));
    }

    // Filter by ownership
    if (owned === 'true') {
      query += ` AND lp.owner_id IS NOT NULL`;
    } else if (owned === 'false') {
      query += ` AND lp.owner_id IS NULL`;
    }

    // Filter by biome
    if (biome) {
      query += ` AND lp.biome_type = $${paramIndex++}`;
      params.push(biome);
    }

    query += ' ORDER BY lp.row_index, lp.col_index';

    const parcels = await database.query(query, params);
    res.json(parcels);
  } catch (error) {
    console.error('Failed to fetch parcels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/land/parcels/:code - Get single parcel details (school-scoped)
router.get('/parcels/:code', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.params;
    const { town_class } = req.query;
    const schoolId = req.user?.school_id ?? null;
    const townClass = resolveTownClass(req, town_class);
    if (!townClass) {
      return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
    }
    
    const parcel = await database.get(
      schoolId !== null
        ? `SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
           FROM land_parcels lp
           LEFT JOIN users u ON lp.owner_id = u.id
           WHERE lp.grid_code = $1 AND lp.school_id = $2 AND lp.town_class = $3`
        : `SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
           FROM land_parcels lp
           LEFT JOIN users u ON lp.owner_id = u.id
           WHERE lp.grid_code = $1 AND lp.school_id IS NULL AND lp.town_class = $2`,
      schoolId !== null ? [code.toUpperCase(), schoolId, townClass] : [code.toUpperCase(), townClass]
    );

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' });
    }

    // Check if there's a pending purchase request for this parcel
    const pendingRequest = await database.get(`
      SELECT lpr.*, u.username as applicant_username
      FROM land_purchase_requests lpr
      JOIN users u ON lpr.user_id = u.id
      WHERE lpr.parcel_id = $1 AND lpr.status IN ('pending_engineer', 'pending_teacher')
    `, [parcel.id]);

    res.json({ ...parcel, pending_request: pendingRequest || null });
  } catch (error) {
    console.error('Failed to fetch parcel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/land/my-properties - Get current user's owned properties
router.get('/my-properties', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userClass = req.user!.class;
    const townClass = isTownClass(userClass) ? userClass : null;
    const parcels = townClass
      ? await database.query(`
          SELECT * FROM land_parcels
          WHERE owner_id = $1 AND town_class = $2
          ORDER BY purchased_at DESC
        `, [req.user!.id, townClass])
      : await database.query(`
          SELECT * FROM land_parcels
          WHERE owner_id = $1
          ORDER BY purchased_at DESC
        `, [req.user!.id]);

    for (const p of parcels) {
      if (!p.purchased_at) continue;
      const purchasePrice = Number(p.purchase_price ?? p.value);
      const currentValue = calculateAppreciatedValue(purchasePrice, p.purchased_at);
      if (currentValue !== Number(p.value)) {
        await database.run(
          'UPDATE land_parcels SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [currentValue, p.id]
        );
        p.value = currentValue;
      }
      if (!p.purchase_price) {
        p.purchase_price = purchasePrice;
      }
    }

    const enriched = parcels.map((p: LandParcel) => enrichOwnedParcel(p as any));
    const totalValue = enriched.reduce((sum: number, p: { current_value: number }) => sum + p.current_value, 0);
    const totalPurchaseValue = enriched.reduce((sum: number, p: { purchase_price: number }) => sum + p.purchase_price, 0);

    res.json({
      parcels: enriched,
      total_count: enriched.length,
      total_value: totalValue,
      total_purchase_value: totalPurchaseValue,
    });
  } catch (error) {
    console.error('Failed to fetch user properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/land/purchase-request - Submit a purchase request
router.post('/purchase-request',
  authenticateToken,
  [
    body('parcel_id').isInt({ min: 1 }).withMessage('Valid parcel ID required'),
    body('offered_price').isFloat({ min: 0 }).withMessage('Valid offered price required')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { parcel_id, offered_price } = req.body;

      // Check if parcel exists and is not owned
      const parcel = await database.get('SELECT * FROM land_parcels WHERE id = $1', [parcel_id]);
      if (!parcel) {
        return res.status(404).json({ error: 'Parcel not found' });
      }
      if (parcel.owner_id) {
        return res.status(400).json({ error: 'This parcel is already owned' });
      }

      const userClass = req.user!.class;
      if (isTownClass(userClass) && parcel.town_class && parcel.town_class !== userClass) {
        return res.status(403).json({ error: 'You can only purchase land in your town' });
      }

      const parcelSchoolId = parcel.school_id ?? null;
      const userSchoolId = req.user!.school_id ?? null;
      if (parcelSchoolId !== userSchoolId) {
        return res.status(404).json({ error: 'Parcel not found' });
      }

      // SECURITY: Validate offered price is at least 90% of parcel value (allow small negotiation room)
      const parcelValue = parseFloat(parcel.value);
      const offeredAmount = parseFloat(offered_price);
      const minimumOffer = parcelValue * 0.9; // Allow up to 10% discount
      if (offeredAmount < minimumOffer) {
        return res.status(400).json({ 
          error: `Offered price (R${offeredAmount.toFixed(2)}) is too low. Minimum offer is R${minimumOffer.toFixed(2)} (90% of land value)` 
        });
      }

      // Check if user already has a pending request for this parcel
      const existingRequest = await database.get(`
        SELECT * FROM land_purchase_requests 
        WHERE user_id = $1 AND parcel_id = $2 AND status IN ('pending_engineer', 'pending_teacher')
      `, [req.user!.id, parcel_id]);

      if (existingRequest) {
        return res.status(400).json({ error: 'You already have a pending request for this parcel' });
      }

      const totalCost = calculateTotalPurchaseCost(offeredAmount);
      const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [req.user!.id]);
      if (!account || Number(account.balance) < totalCost) {
        return res.status(400).json({
          error: `Insufficient balance. You need ${totalCost.toFixed(2)} (plot price plus 10% engineer approval fee).`,
        });
      }

      const townClassForEngineers = parcel.town_class || userClass;
      const requiredEngineers = isTownClass(townClassForEngineers)
        ? await getRequiredLandEngineers(userSchoolId, townClassForEngineers)
        : [];
      const initialStatus = requiredEngineers.length > 0 ? 'pending_engineer' : 'pending_teacher';

      // Create purchase request (with school_id for tenant isolation)
      const schoolId = req.user!.school_id ?? null;
      const result = schoolId !== null
        ? await database.get(`
            INSERT INTO land_purchase_requests (user_id, parcel_id, offered_price, status, school_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [req.user!.id, parcel_id, offered_price, initialStatus, schoolId])
        : await database.get(`
            INSERT INTO land_purchase_requests (user_id, parcel_id, offered_price, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [req.user!.id, parcel_id, offered_price, initialStatus]);

      res.status(201).json({
        message: initialStatus === 'pending_engineer'
          ? 'Purchase request submitted — Architects and Civil Engineers in your class must approve first'
          : 'Purchase request submitted for teacher approval',
        request: result
      });
    } catch (error) {
      console.error('Failed to create purchase request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/land/purchase-requests - teachers, buyers, or engineer approval queue
router.get('/purchase-requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, town_class, role } = req.query;
    const schoolId = req.user?.school_id ?? null;

    if (req.user!.role === 'student' && role === 'engineer') {
      const user = await database.get(
        `SELECT u.id, u.class, u.school_id, j.name AS job_name
         FROM users u LEFT JOIN jobs j ON j.id = u.job_id WHERE u.id = $1`,
        [req.user!.id]
      );
      if (!user || !isLandEngineerJob(user.job_name)) {
        return res.status(403).json({ error: 'Only Architects and Civil Engineers can view the approval queue' });
      }
      if (!user.class) {
        return res.json([]);
      }

      const userId = req.user!.id;
      let rows;
      if (schoolId !== null) {
        rows = await database.query(
          `SELECT lpr.*,
                  u.username AS applicant_username,
                  u.first_name AS applicant_first_name,
                  u.last_name AS applicant_last_name,
                  u.class AS applicant_class,
                  lp.grid_code AS parcel_grid_code,
                  lp.biome_type AS parcel_biome_type,
                  lp.value AS parcel_value,
                  lp.town_class AS parcel_town_class,
                  r.username AS reviewer_username
           FROM land_purchase_requests lpr
           JOIN users u ON lpr.user_id = u.id
           JOIN land_parcels lp ON lpr.parcel_id = lp.id
           LEFT JOIN users r ON lpr.reviewed_by = r.id
           WHERE lpr.status = 'pending_engineer'
             AND lp.town_class = $1
             AND u.school_id = $2
             AND lpr.user_id != $3
             AND NOT EXISTS (
               SELECT 1 FROM land_purchase_engineer_approvals lpea
               WHERE lpea.request_id = lpr.id AND lpea.approver_id = $3
             )
           ORDER BY lpr.created_at ASC`,
          [user.class, schoolId, userId]
        );
      } else {
        rows = await database.query(
          `SELECT lpr.*,
                  u.username AS applicant_username,
                  u.first_name AS applicant_first_name,
                  u.last_name AS applicant_last_name,
                  u.class AS applicant_class,
                  lp.grid_code AS parcel_grid_code,
                  lp.biome_type AS parcel_biome_type,
                  lp.value AS parcel_value,
                  lp.town_class AS parcel_town_class,
                  r.username AS reviewer_username
           FROM land_purchase_requests lpr
           JOIN users u ON lpr.user_id = u.id
           JOIN land_parcels lp ON lpr.parcel_id = lp.id
           LEFT JOIN users r ON lpr.reviewed_by = r.id
           WHERE lpr.status = 'pending_engineer'
             AND lp.town_class = $1
             AND u.school_id IS NULL
             AND lpr.user_id != $2
             AND NOT EXISTS (
               SELECT 1 FROM land_purchase_engineer_approvals lpea
               WHERE lpea.request_id = lpr.id AND lpea.approver_id = $2
             )
           ORDER BY lpr.created_at ASC`,
          [user.class, userId]
        );
      }

      const requiredEngineers = await getRequiredLandEngineers(schoolId, user.class);
      const isRequired = requiredEngineers.some((e) => e.id === req.user!.id);
      const filtered = isRequired ? rows : [];

      const enriched = await Promise.all(filtered.map((row) => enrichPurchaseRequestWithEngineers(row)));
      return res.json(enriched);
    }

    let query: string;
    let params: any[];
    const townClass = req.user!.role === 'teacher' ? resolveTownClass(req, town_class) : null;

    if (req.user!.role === 'teacher') {
      query = `
        SELECT lpr.*, 
               u.username as applicant_username, 
               u.first_name as applicant_first_name, 
               u.last_name as applicant_last_name,
               u.class as applicant_class,
               lp.grid_code as parcel_grid_code,
               lp.biome_type as parcel_biome_type,
               lp.value as parcel_value,
               lp.town_class as parcel_town_class,
               r.username as reviewer_username
        FROM land_purchase_requests lpr
        JOIN users u ON lpr.user_id = u.id
        JOIN land_parcels lp ON lpr.parcel_id = lp.id
        LEFT JOIN users r ON lpr.reviewed_by = r.id
      `;
      params = [];
      
      if (schoolId !== null) {
        query += ' WHERE u.school_id = $1';
        params.push(schoolId);
      } else {
        query += ' WHERE u.school_id IS NULL';
      }
      if (status) {
        query += ` AND lpr.status = $${params.length + 1}`;
        params.push(status);
      }
      if (townClass) {
        query += ` AND lp.town_class = $${params.length + 1}`;
        params.push(townClass);
      }
      
      query += ' ORDER BY lpr.created_at DESC';
    } else {
      query = `
        SELECT lpr.*, 
               lp.grid_code as parcel_grid_code,
               lp.biome_type as parcel_biome_type,
               lp.value as parcel_value,
               lp.town_class as parcel_town_class,
               r.username as reviewer_username
        FROM land_purchase_requests lpr
        JOIN land_parcels lp ON lpr.parcel_id = lp.id
        LEFT JOIN users r ON lpr.reviewed_by = r.id
        WHERE lpr.user_id = $1
      `;
      params = [req.user!.id];
      
      if (status) {
        query += ' AND lpr.status = $2';
        params.push(status);
      }
      
      query += ' ORDER BY lpr.created_at DESC';
    }

    const requests = await database.query(query, params);
    const enriched = await Promise.all(requests.map((row) => enrichPurchaseRequestWithEngineers(row)));
    res.json(enriched);
  } catch (error) {
    console.error('Failed to fetch purchase requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/land/purchase-requests/:id - Approve or deny a purchase request (teachers only, same school)
router.put('/purchase-requests/:id',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied'),
    body('denial_reason').optional().isString()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestId = parseInt(req.params.id);
      const { status, denial_reason } = req.body;
      const schoolId = req.user?.school_id ?? null;

      // Get the purchase request (must be from a student in teacher's school)
      const purchaseRequest = await database.get(`
        SELECT lpr.*, lp.owner_id, lp.value as parcel_value, u.school_id as applicant_school_id
        FROM land_purchase_requests lpr
        JOIN land_parcels lp ON lpr.parcel_id = lp.id
        JOIN users u ON lpr.user_id = u.id
        WHERE lpr.id = $1
      `, [requestId]);

      if (!purchaseRequest) {
        return res.status(404).json({ error: 'Purchase request not found' });
      }
      if (schoolId !== null && purchaseRequest.applicant_school_id !== schoolId) {
        return res.status(404).json({ error: 'Purchase request not found' });
      }

      // Normalize status comparison (handle case sensitivity)
      const currentStatus = String(purchaseRequest.status).toLowerCase().trim();
      if (currentStatus !== 'pending_teacher') {
        return res.status(400).json({
          error: currentStatus === 'pending_engineer'
            ? 'Engineers must approve this request before the teacher can review it'
            : 'This request has already been processed',
        });
      }

      if (purchaseRequest.owner_id) {
        // Parcel was purchased by someone else in the meantime
        await database.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied', 
              denial_reason = 'Parcel was purchased by another user',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [req.user!.id, requestId]);
        return res.status(400).json({ error: 'Parcel is no longer available' });
      }

      if (status === 'approved') {
        // Check if user still has sufficient balance
        const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [purchaseRequest.user_id]);
        const accountBalance = Number(account?.balance) || 0;
        const offeredPrice = Number(purchaseRequest.offered_price) || 0;
        if (!account || accountBalance < offeredPrice) {
          await database.run(`
            UPDATE land_purchase_requests 
            SET status = 'denied', 
                denial_reason = 'Insufficient balance at time of approval',
                reviewed_by = $1,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [req.user!.id, requestId]);
          return res.status(400).json({ error: 'User has insufficient balance' });
        }

        // Deduct balance from user's account
        await database.run(`
          UPDATE accounts 
          SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $2
        `, [offeredPrice, purchaseRequest.user_id]);

        // Get buyer's class and school_id for treasury deposit
        const buyer = await database.get('SELECT class, school_id FROM users WHERE id = $1', [purchaseRequest.user_id]);
        const buyerClass = buyer?.class;
        const landSchoolId = buyer?.school_id ?? null;

        // Deposit to treasury for the buyer's class (filtered by school_id)
        if (buyerClass && ['6A', '6B', '6C'].includes(buyerClass)) {
          if (landSchoolId != null) {
            await database.run(
              'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
              [offeredPrice, buyerClass, landSchoolId]
            );
          } else {
            await database.run(
              'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
              [offeredPrice, buyerClass]
            );
          }

          // Record treasury transaction
          await database.run(
            'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
            [landSchoolId, buyerClass, offeredPrice, 'deposit', `Land Purchase: Plot ${purchaseRequest.parcel_id}`, purchaseRequest.user_id]
          );
        }

        // Record the transaction
        const userAccount = await database.get('SELECT id FROM accounts WHERE user_id = $1', [purchaseRequest.user_id]);
        await database.run(`
          INSERT INTO transactions (from_account_id, amount, transaction_type, description)
          VALUES ($1, $2, 'withdrawal', $3)
        `, [userAccount.id, offeredPrice, `Land purchase: Plot ${purchaseRequest.parcel_id}`]);

        // Transfer ownership
        await database.run(`
          UPDATE land_parcels 
          SET owner_id = $1, 
              purchased_at = CURRENT_TIMESTAMP,
              purchase_price = $2,
              value = $2,
              last_rent_collected_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [purchaseRequest.user_id, offeredPrice, purchaseRequest.parcel_id]);

        // Update request status
        await database.run(`
          UPDATE land_purchase_requests 
          SET status = 'approved',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [req.user!.id, requestId]);

        // Deny any other pending requests for this parcel
        await database.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied',
              denial_reason = 'Parcel was purchased by another user',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE parcel_id = $2 AND id != $3 AND status IN ('pending_engineer', 'pending_teacher')
        `, [req.user!.id, purchaseRequest.parcel_id, requestId]);

      } else {
        // Deny the request
        await database.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied',
              denial_reason = $1,
              reviewed_by = $2,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [denial_reason || 'Request denied by teacher', req.user!.id, requestId]);
      }

      const updated = await database.get(`
        SELECT lpr.*, 
               u.username as applicant_username,
               lp.grid_code as parcel_grid_code
        FROM land_purchase_requests lpr
        JOIN users u ON lpr.user_id = u.id
        JOIN land_parcels lp ON lpr.parcel_id = lp.id
        WHERE lpr.id = $1
      `, [requestId]);

      res.json({
        message: `Purchase request ${status}`,
        request: updated
      });
    } catch (error) {
      console.error('Failed to update purchase request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/land/seed - Seed initial land data for teacher's school (teachers only)
router.post('/seed',
  authenticateToken,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.user?.school_id ?? null;
      const townRows = schoolId !== null
        ? await database.query(
            'SELECT town_class, COUNT(*) as count FROM land_parcels WHERE school_id = $1 GROUP BY town_class',
            [schoolId]
          )
        : await database.query(
            'SELECT town_class, COUNT(*) as count FROM land_parcels WHERE school_id IS NULL GROUP BY town_class'
          );
      const hasAllTowns = TOWN_CLASSES.every((tc) =>
        townRows.some((row: { town_class: string; count: string | number }) => row.town_class === tc && Number(row.count) >= 100)
      );
      if (hasAllTowns) {
        const totalCount = townRows.reduce((sum: number, row: { count: string | number }) => sum + Number(row.count), 0);
        return res.status(400).json({
          error: 'Land parcels already seeded for this school',
          count: totalCount
        });
      }

      // Biome types array for random assignment
      const biomeTypes: BiomeType[] = [
        'Savanna', 'Grassland', 'Forest', 'Fynbos', 
        'Nama Karoo', 'Succulent Karoo', 'Desert', 
        'Thicket', 'Indian Ocean Coastal Belt'
      ];

      const getBiomeForPosition = (row: number, col: number, townClass: TownClass): BiomeType => {
        const regionSize = 3;
        const regionRow = Math.floor(row / regionSize);
        const regionCol = Math.floor(col / regionSize);
        const offset = townClassOffset(townClass);
        const seed = (regionRow * 7 + regionCol * 13 + offset) % biomeTypes.length;
        const variation = (row * 3 + col * 5 + offset) % 100;
        if (variation < 20) {
          return biomeTypes[(seed + 1) % biomeTypes.length];
        }
        return biomeTypes[seed];
      };

      const parcels: string[] = [];
      for (const townClass of TOWN_CLASSES) {
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            const gridCode = generateGridCode(row, col);
            const biome = getBiomeForPosition(row, col, townClass);
            const config = BIOME_CONFIG[biome];
            const value = config.baseValue;
            parcels.push(`('${gridCode}', ${row}, ${col}, '${biome}', ${value}, '${config.risk}', ARRAY[${config.pros.map(p => `'${p.replace(/'/g, "''")}'`).join(',')}], ARRAY[${config.cons.map(c => `'${c.replace(/'/g, "''")}'`).join(',')}], '${townClass}')`);
          }
        }
      }

      const batchSize = 100;
      const insertCols = schoolId !== null
        ? 'grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, town_class, school_id'
        : 'grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, town_class';
      for (let i = 0; i < parcels.length; i += batchSize) {
        const batch = parcels.slice(i, i + batchSize);
        const values = schoolId !== null
          ? batch.map(v => v.replace(/\)$/, `, ${schoolId})`))
          : batch;
        await database.run(`
          INSERT INTO land_parcels (${insertCols})
          VALUES ${values.join(', ')}
        `);
      }

      res.json({
        message: 'Land parcels seeded successfully for all towns',
        count: parcels.length
      });
    } catch (error) {
      console.error('Failed to seed land parcels:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/land/stats - Get land statistics (school- and town-scoped)
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { town_class } = req.query;
    const schoolId = req.user?.school_id ?? null;
    const townClass = resolveTownClass(req, town_class);
    if (!townClass) {
      return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
    }

    const schoolFilter = schoolId !== null
      ? 'WHERE lp.school_id = $1 AND lp.town_class = $2'
      : 'WHERE lp.school_id IS NULL AND lp.town_class = $1';
    const schoolFilterLpr = schoolId !== null
      ? `lpr.school_id = $1 AND lpr.status = 'pending_teacher' AND lp.town_class = $2`
      : `lpr.school_id IS NULL AND lpr.status = 'pending_teacher' AND lp.town_class = $1`;
    const params = schoolId !== null ? [schoolId, townClass] : [townClass];

    const totalParcels = await database.get(
      `SELECT COUNT(*) as count FROM land_parcels lp ${schoolFilter}`,
      params
    );
    const ownedParcels = await database.get(
      `SELECT COUNT(*) as count FROM land_parcels lp ${schoolFilter} AND lp.owner_id IS NOT NULL`,
      params
    );
    const pendingRequests = await database.get(
      `SELECT COUNT(*) as count FROM land_purchase_requests lpr
       JOIN land_parcels lp ON lpr.parcel_id = lp.id
       WHERE ${schoolFilterLpr}`,
      params
    );
    
    const biomeStats = await database.query(
      `SELECT lp.biome_type, COUNT(*) as count, 
              COUNT(lp.owner_id) as owned_count,
              AVG(lp.value) as avg_value
       FROM land_parcels lp
       ${schoolFilter}
       GROUP BY lp.biome_type`,
      params
    );

    const topOwnersParams = schoolId !== null ? [schoolId, townClass] : [townClass];
    const topOwners = await database.query(
      `SELECT u.username, u.first_name, u.last_name, 
              COUNT(lp.id) as parcel_count,
              SUM(lp.value) as total_value
       FROM land_parcels lp
       JOIN users u ON lp.owner_id = u.id
       ${schoolId !== null ? 'WHERE lp.school_id = $1 AND lp.town_class = $2' : 'WHERE lp.school_id IS NULL AND lp.town_class = $1'}
       GROUP BY u.id, u.username, u.first_name, u.last_name
       ORDER BY parcel_count DESC
       LIMIT 10`,
      topOwnersParams
    );

    res.json({
      total_parcels: totalParcels?.count || 0,
      owned_parcels: ownedParcels?.count || 0,
      available_parcels: (totalParcels?.count || 0) - (ownedParcels?.count || 0),
      pending_requests: pendingRequests?.count || 0,
      town_class: townClass,
      biome_stats: biomeStats,
      top_owners: topOwners
    });
  } catch (error) {
    console.error('Failed to fetch land stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/land/biome-config - Get biome configuration
router.get('/biome-config', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  res.json(BIOME_CONFIG);
});

// POST /api/land/swap - Swap positions of two parcels (teachers only)
router.post('/swap',
  authenticateToken,
  requireRole(['teacher']),
  body('parcel_id_a').isInt().toInt(),
  body('parcel_id_b').isInt().toInt(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { parcel_id_a, parcel_id_b } = req.body;
      if (parcel_id_a === parcel_id_b) {
        return res.status(400).json({ error: 'Cannot swap a parcel with itself' });
      }

      const schoolId = req.user?.school_id ?? null;
      const parcelA = await database.get('SELECT id, row_index, col_index, grid_code, school_id, town_class FROM land_parcels WHERE id = $1', [parcel_id_a]);
      const parcelB = await database.get('SELECT id, row_index, col_index, grid_code, school_id, town_class FROM land_parcels WHERE id = $1', [parcel_id_b]);
      if (!parcelA || !parcelB) {
        return res.status(404).json({ error: 'One or both parcels not found' });
      }
      if (parcelA.town_class !== parcelB.town_class) {
        return res.status(400).json({ error: 'Parcels must belong to the same town' });
      }
      if (schoolId !== null && (parcelA.school_id !== schoolId || parcelB.school_id !== schoolId)) {
        return res.status(404).json({ error: 'One or both parcels not found' });
      }
      if (schoolId === null && (parcelA.school_id != null || parcelB.school_id != null)) {
        return res.status(404).json({ error: 'One or both parcels not found' });
      }

      const aRow = Number(parcelA.row_index);
      const aCol = Number(parcelA.col_index);
      const bRow = Number(parcelB.row_index);
      const bCol = Number(parcelB.col_index);
      const aCode = generateGridCode(aRow, aCol);
      const bCode = generateGridCode(bRow, bCol);

      // Swap positions using temp to avoid unique constraint issues
      await database.run(
        'UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4',
        [-1, -1, '_temp_' + parcel_id_a, parcel_id_a]
      );
      await database.run(
        'UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4',
        [aRow, aCol, aCode, parcel_id_b]
      );
      await database.run(
        'UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4',
        [bRow, bCol, bCode, parcel_id_a]
      );

      res.json({ message: 'Parcels swapped successfully' });
    } catch (error) {
      console.error('Failed to swap parcels:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/land/recalculate-values - Recalculate parcel values for teacher's school (teachers only)
router.post('/recalculate-values',
  authenticateToken,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { town_class } = req.query;
      const schoolId = req.user?.school_id ?? null;
      const townClass = resolveTownClass(req, town_class);
      if (!townClass) {
        return res.status(400).json({ error: 'Valid town_class (6A, 6B, or 6C) is required' });
      }

      const parcels = schoolId !== null
        ? await database.query('SELECT id, row_index, col_index, biome_type FROM land_parcels WHERE school_id = $1 AND town_class = $2', [schoolId, townClass])
        : await database.query('SELECT id, row_index, col_index, biome_type FROM land_parcels WHERE school_id IS NULL AND town_class = $1', [townClass]);
      let updated = 0;
      for (const p of parcels) {
        const biome = p.biome_type as BiomeType;
        const config = BIOME_CONFIG[biome];
        if (!config) continue;
        const value = config.baseValue;
        await database.run('UPDATE land_parcels SET value = $1 WHERE id = $2', [value, p.id]);
        updated++;
      }
      res.json({ message: 'Land values recalculated', updated, town_class: townClass });
    } catch (error) {
      console.error('Failed to recalculate land values:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

