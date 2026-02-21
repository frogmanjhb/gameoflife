"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Biome configuration with pros/cons and base values (prices set so land is meaningful vs salaries)
const BIOME_CONFIG = {
    'Savanna': {
        baseValue: 40000,
        risk: 'medium',
        pros: ['Good grazing land', 'Wildlife tourism potential', 'Moderate rainfall'],
        cons: ['Seasonal droughts', 'Fire risk', 'Limited water sources']
    },
    'Grassland': {
        baseValue: 30000,
        risk: 'low',
        pros: ['Excellent farming potential', 'Easy to develop', 'Stable ecosystem'],
        cons: ['Soil erosion risk', 'Limited shade', 'Overgrazing concerns']
    },
    'Forest': {
        baseValue: 70000,
        risk: 'medium',
        pros: ['Rich biodiversity', 'Timber resources', 'Carbon credits potential'],
        cons: ['Fire risk', 'Clearing restrictions', 'Difficult access']
    },
    'Fynbos': {
        baseValue: 90000,
        risk: 'high',
        pros: ['Unique biodiversity', 'Eco-tourism value', 'Protected species habitat'],
        cons: ['Fire-dependent ecosystem', 'Strict conservation laws', 'Limited development']
    },
    'Nama Karoo': {
        baseValue: 20000,
        risk: 'medium',
        pros: ['Sheep farming suited', 'Low land cost', 'Unique landscape'],
        cons: ['Very dry climate', 'Limited water', 'Remote location']
    },
    'Succulent Karoo': {
        baseValue: 9000,
        risk: 'high',
        pros: ['Rare plant species', 'Research value', 'Mining potential'],
        cons: ['Extreme temperatures', 'Water scarcity', 'Conservation restrictions']
    },
    'Desert': {
        baseValue: 16000,
        risk: 'high',
        pros: ['Solar energy potential', 'Low land price', 'Mineral deposits'],
        cons: ['Extreme conditions', 'No water', 'Uninhabitable without infrastructure']
    },
    'Thicket': {
        baseValue: 50000,
        risk: 'low',
        pros: ['Carbon storage', 'Game farming potential', 'Drought resistant'],
        cons: ['Dense vegetation', 'Clearing needed', 'Elephant damage risk']
    },
    'Indian Ocean Coastal Belt': {
        baseValue: 120000,
        risk: 'medium',
        pros: ['High property value', 'Tourism potential', 'Port access'],
        cons: ['Coastal erosion', 'Cyclone risk', 'High development costs']
    }
};
// Helper: Convert row index to Excel-style letter code (A-Z, AA-AZ, BA-BZ, CA-CV)
function rowToLetterCode(row) {
    if (row < 26) {
        return String.fromCharCode(65 + row); // A-Z
    }
    const first = Math.floor(row / 26) - 1;
    const second = row % 26;
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}
// Helper: Convert letter code back to row index
function letterCodeToRow(code) {
    if (code.length === 1) {
        return code.charCodeAt(0) - 65;
    }
    const first = (code.charCodeAt(0) - 65 + 1) * 26;
    const second = code.charCodeAt(1) - 65;
    return first + second;
}
// Helper: Generate grid code from row and column
function generateGridCode(row, col) {
    return `${rowToLetterCode(row)}${col + 1}`;
}
// GET /api/land/parcels - Get all parcels (with optional viewport filtering)
router.get('/parcels', auth_1.authenticateToken, async (req, res) => {
    try {
        const { minRow, maxRow, minCol, maxCol, owned, biome } = req.query;
        const schoolId = req.user?.school_id ?? null;
        let query = `
      SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM land_parcels lp
      LEFT JOIN users u ON lp.owner_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (schoolId !== null) {
            query += ` AND lp.school_id = $${paramIndex++}`;
            params.push(schoolId);
        }
        else {
            query += ' AND lp.school_id IS NULL';
        }
        // Viewport filtering for performance
        if (minRow !== undefined && maxRow !== undefined) {
            query += ` AND lp.row_index >= $${paramIndex++} AND lp.row_index <= $${paramIndex++}`;
            params.push(parseInt(minRow), parseInt(maxRow));
        }
        if (minCol !== undefined && maxCol !== undefined) {
            query += ` AND lp.col_index >= $${paramIndex++} AND lp.col_index <= $${paramIndex++}`;
            params.push(parseInt(minCol), parseInt(maxCol));
        }
        // Filter by ownership
        if (owned === 'true') {
            query += ` AND lp.owner_id IS NOT NULL`;
        }
        else if (owned === 'false') {
            query += ` AND lp.owner_id IS NULL`;
        }
        // Filter by biome
        if (biome) {
            query += ` AND lp.biome_type = $${paramIndex++}`;
            params.push(biome);
        }
        query += ' ORDER BY lp.row_index, lp.col_index';
        const parcels = await database_prod_1.default.query(query, params);
        res.json(parcels);
    }
    catch (error) {
        console.error('Failed to fetch parcels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/land/parcels/:code - Get single parcel details (school-scoped)
router.get('/parcels/:code', auth_1.authenticateToken, async (req, res) => {
    try {
        const { code } = req.params;
        const schoolId = req.user?.school_id ?? null;
        const parcel = await database_prod_1.default.get(schoolId !== null
            ? `SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
           FROM land_parcels lp
           LEFT JOIN users u ON lp.owner_id = u.id
           WHERE lp.grid_code = $1 AND lp.school_id = $2`
            : `SELECT lp.*, u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
           FROM land_parcels lp
           LEFT JOIN users u ON lp.owner_id = u.id
           WHERE lp.grid_code = $1 AND lp.school_id IS NULL`, schoolId !== null ? [code.toUpperCase(), schoolId] : [code.toUpperCase()]);
        if (!parcel) {
            return res.status(404).json({ error: 'Parcel not found' });
        }
        // Check if there's a pending purchase request for this parcel
        const pendingRequest = await database_prod_1.default.get(`
      SELECT lpr.*, u.username as applicant_username
      FROM land_purchase_requests lpr
      JOIN users u ON lpr.user_id = u.id
      WHERE lpr.parcel_id = $1 AND lpr.status = 'pending'
    `, [parcel.id]);
        res.json({ ...parcel, pending_request: pendingRequest || null });
    }
    catch (error) {
        console.error('Failed to fetch parcel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/land/my-properties - Get current user's owned properties
router.get('/my-properties', auth_1.authenticateToken, async (req, res) => {
    try {
        const parcels = await database_prod_1.default.query(`
      SELECT * FROM land_parcels
      WHERE owner_id = $1
      ORDER BY purchased_at DESC
    `, [req.user.id]);
        // Calculate total value
        const totalValue = parcels.reduce((sum, p) => sum + Number(p.value), 0);
        res.json({
            parcels,
            total_count: parcels.length,
            total_value: totalValue
        });
    }
    catch (error) {
        console.error('Failed to fetch user properties:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/land/purchase-request - Submit a purchase request
router.post('/purchase-request', auth_1.authenticateToken, [
    (0, express_validator_1.body)('parcel_id').isInt({ min: 1 }).withMessage('Valid parcel ID required'),
    (0, express_validator_1.body)('offered_price').isFloat({ min: 0 }).withMessage('Valid offered price required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { parcel_id, offered_price } = req.body;
        // Check if parcel exists and is not owned
        const parcel = await database_prod_1.default.get('SELECT * FROM land_parcels WHERE id = $1', [parcel_id]);
        if (!parcel) {
            return res.status(404).json({ error: 'Parcel not found' });
        }
        if (parcel.owner_id) {
            return res.status(400).json({ error: 'This parcel is already owned' });
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
        const existingRequest = await database_prod_1.default.get(`
        SELECT * FROM land_purchase_requests 
        WHERE user_id = $1 AND parcel_id = $2 AND status = 'pending'
      `, [req.user.id, parcel_id]);
        if (existingRequest) {
            return res.status(400).json({ error: 'You already have a pending request for this parcel' });
        }
        // Check if user has sufficient balance
        const account = await database_prod_1.default.get('SELECT balance FROM accounts WHERE user_id = $1', [req.user.id]);
        if (!account || account.balance < offered_price) {
            return res.status(400).json({ error: 'Insufficient balance for this purchase' });
        }
        // Create purchase request (with school_id for tenant isolation)
        const schoolId = req.user.school_id ?? null;
        const result = schoolId !== null
            ? await database_prod_1.default.get(`
            INSERT INTO land_purchase_requests (user_id, parcel_id, offered_price, status, school_id)
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING *
          `, [req.user.id, parcel_id, offered_price, schoolId])
            : await database_prod_1.default.get(`
            INSERT INTO land_purchase_requests (user_id, parcel_id, offered_price, status)
            VALUES ($1, $2, $3, 'pending')
            RETURNING *
          `, [req.user.id, parcel_id, offered_price]);
        res.status(201).json({
            message: 'Purchase request submitted successfully',
            request: result
        });
    }
    catch (error) {
        console.error('Failed to create purchase request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/land/purchase-requests - Get purchase requests (teachers see all pending, students see their own)
router.get('/purchase-requests', auth_1.authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query;
        let params;
        const schoolId = req.user?.school_id ?? null;
        if (req.user.role === 'teacher') {
            query = `
        SELECT lpr.*, 
               u.username as applicant_username, 
               u.first_name as applicant_first_name, 
               u.last_name as applicant_last_name,
               u.class as applicant_class,
               lp.grid_code as parcel_grid_code,
               lp.biome_type as parcel_biome_type,
               lp.value as parcel_value,
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
            }
            else {
                query += ' WHERE u.school_id IS NULL';
            }
            if (status) {
                query += ` AND lpr.status = $${params.length + 1}`;
                params.push(status);
            }
            query += ' ORDER BY lpr.created_at DESC';
        }
        else {
            query = `
        SELECT lpr.*, 
               lp.grid_code as parcel_grid_code,
               lp.biome_type as parcel_biome_type,
               lp.value as parcel_value,
               r.username as reviewer_username
        FROM land_purchase_requests lpr
        JOIN land_parcels lp ON lpr.parcel_id = lp.id
        LEFT JOIN users r ON lpr.reviewed_by = r.id
        WHERE lpr.user_id = $1
      `;
            params = [req.user.id];
            if (status) {
                query += ' AND lpr.status = $2';
                params.push(status);
            }
            query += ' ORDER BY lpr.created_at DESC';
        }
        const requests = await database_prod_1.default.query(query, params);
        res.json(requests);
    }
    catch (error) {
        console.error('Failed to fetch purchase requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/land/purchase-requests/:id - Approve or deny a purchase request (teachers only, same school)
router.put('/purchase-requests/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied'),
    (0, express_validator_1.body)('denial_reason').optional().isString()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const requestId = parseInt(req.params.id);
        const { status, denial_reason } = req.body;
        const schoolId = req.user?.school_id ?? null;
        // Get the purchase request (must be from a student in teacher's school)
        const purchaseRequest = await database_prod_1.default.get(`
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
        if (currentStatus !== 'pending') {
            return res.status(400).json({ error: 'This request has already been processed' });
        }
        if (purchaseRequest.owner_id) {
            // Parcel was purchased by someone else in the meantime
            await database_prod_1.default.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied', 
              denial_reason = 'Parcel was purchased by another user',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [req.user.id, requestId]);
            return res.status(400).json({ error: 'Parcel is no longer available' });
        }
        if (status === 'approved') {
            // Check if user still has sufficient balance
            const account = await database_prod_1.default.get('SELECT balance FROM accounts WHERE user_id = $1', [purchaseRequest.user_id]);
            const accountBalance = Number(account?.balance) || 0;
            const offeredPrice = Number(purchaseRequest.offered_price) || 0;
            if (!account || accountBalance < offeredPrice) {
                await database_prod_1.default.run(`
            UPDATE land_purchase_requests 
            SET status = 'denied', 
                denial_reason = 'Insufficient balance at time of approval',
                reviewed_by = $1,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [req.user.id, requestId]);
                return res.status(400).json({ error: 'User has insufficient balance' });
            }
            // Deduct balance from user's account
            await database_prod_1.default.run(`
          UPDATE accounts 
          SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $2
        `, [offeredPrice, purchaseRequest.user_id]);
            // Get buyer's class and school_id for treasury deposit
            const buyer = await database_prod_1.default.get('SELECT class, school_id FROM users WHERE id = $1', [purchaseRequest.user_id]);
            const buyerClass = buyer?.class;
            const landSchoolId = buyer?.school_id ?? null;
            // Deposit to treasury for the buyer's class (filtered by school_id)
            if (buyerClass && ['6A', '6B', '6C'].includes(buyerClass)) {
                if (landSchoolId != null) {
                    await database_prod_1.default.run('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [offeredPrice, buyerClass, landSchoolId]);
                }
                else {
                    await database_prod_1.default.run('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [offeredPrice, buyerClass]);
                }
                // Record treasury transaction
                await database_prod_1.default.run('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [landSchoolId, buyerClass, offeredPrice, 'deposit', `Land Purchase: Plot ${purchaseRequest.parcel_id}`, purchaseRequest.user_id]);
            }
            // Record the transaction
            const userAccount = await database_prod_1.default.get('SELECT id FROM accounts WHERE user_id = $1', [purchaseRequest.user_id]);
            await database_prod_1.default.run(`
          INSERT INTO transactions (from_account_id, amount, transaction_type, description)
          VALUES ($1, $2, 'withdrawal', $3)
        `, [userAccount.id, offeredPrice, `Land purchase: Plot ${purchaseRequest.parcel_id}`]);
            // Transfer ownership
            await database_prod_1.default.run(`
          UPDATE land_parcels 
          SET owner_id = $1, 
              purchased_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [purchaseRequest.user_id, purchaseRequest.parcel_id]);
            // Update request status
            await database_prod_1.default.run(`
          UPDATE land_purchase_requests 
          SET status = 'approved',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [req.user.id, requestId]);
            // Deny any other pending requests for this parcel
            await database_prod_1.default.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied',
              denial_reason = 'Parcel was purchased by another user',
              reviewed_by = $1,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE parcel_id = $2 AND id != $3 AND status = 'pending'
        `, [req.user.id, purchaseRequest.parcel_id, requestId]);
        }
        else {
            // Deny the request
            await database_prod_1.default.run(`
          UPDATE land_purchase_requests 
          SET status = 'denied',
              denial_reason = $1,
              reviewed_by = $2,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [denial_reason || 'Request denied by teacher', req.user.id, requestId]);
        }
        const updated = await database_prod_1.default.get(`
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
    }
    catch (error) {
        console.error('Failed to update purchase request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/land/seed - Seed initial land data for teacher's school (teachers only)
router.post('/seed', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? null;
        const existingCount = schoolId !== null
            ? await database_prod_1.default.get('SELECT COUNT(*) as count FROM land_parcels WHERE school_id = $1', [schoolId])
            : await database_prod_1.default.get('SELECT COUNT(*) as count FROM land_parcels WHERE school_id IS NULL');
        if (existingCount && existingCount.count > 0) {
            return res.status(400).json({
                error: 'Land parcels already seeded for this school',
                count: existingCount.count
            });
        }
        // Biome types array for random assignment
        const biomeTypes = [
            'Savanna', 'Grassland', 'Forest', 'Fynbos',
            'Nama Karoo', 'Succulent Karoo', 'Desert',
            'Thicket', 'Indian Ocean Coastal Belt'
        ];
        // Simple noise-based biome distribution
        // This creates clusters of similar biomes rather than pure random
        const getBiomeForPosition = (row, col) => {
            // Use a simple pseudo-random approach based on position
            // Create regions/zones across the map
            const regionSize = 3; // Size of biome regions
            const regionRow = Math.floor(row / regionSize);
            const regionCol = Math.floor(col / regionSize);
            // Seed based on region
            const seed = (regionRow * 7 + regionCol * 13) % biomeTypes.length;
            // Add some variation within regions
            const variation = (row * 3 + col * 5) % 100;
            if (variation < 20) {
                // 20% chance to get a different biome
                return biomeTypes[(seed + 1) % biomeTypes.length];
            }
            return biomeTypes[seed];
        };
        // Generate 100 parcels (10x10)
        const parcels = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const gridCode = generateGridCode(row, col);
                const biome = getBiomeForPosition(row, col);
                const config = BIOME_CONFIG[biome];
                // Add some value variation (±20%)
                const valueVariation = 0.8 + (((row * col) % 100) / 250); // 0.8 to 1.2
                const value = Math.round(config.baseValue * valueVariation);
                parcels.push(`('${gridCode}', ${row}, ${col}, '${biome}', ${value}, '${config.risk}', ARRAY[${config.pros.map(p => `'${p.replace(/'/g, "''")}'`).join(',')}], ARRAY[${config.cons.map(c => `'${c.replace(/'/g, "''")}'`).join(',')}])`);
            }
        }
        // Insert in batches of 100 for performance (with school_id when teacher has school)
        const batchSize = 100;
        const insertCols = schoolId !== null
            ? 'grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons, school_id'
            : 'grid_code, row_index, col_index, biome_type, value, risk_level, pros, cons';
        for (let i = 0; i < parcels.length; i += batchSize) {
            const batch = parcels.slice(i, i + batchSize);
            const values = schoolId !== null
                ? batch.map(v => v.replace(/\)$/, `, ${schoolId})`))
                : batch;
            await database_prod_1.default.run(`
          INSERT INTO land_parcels (${insertCols})
          VALUES ${values.join(', ')}
        `);
        }
        res.json({
            message: 'Land parcels seeded successfully',
            count: 100
        });
    }
    catch (error) {
        console.error('Failed to seed land parcels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/land/stats - Get land statistics (school-scoped)
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? null;
        const schoolFilter = schoolId !== null
            ? 'WHERE lp.school_id = $1'
            : 'WHERE lp.school_id IS NULL';
        const schoolFilterLpr = schoolId !== null
            ? 'lpr.school_id = $1 AND lpr.status = \'pending\''
            : 'lpr.school_id IS NULL AND lpr.status = \'pending\'';
        const params = schoolId !== null ? [schoolId] : [];
        const totalParcels = await database_prod_1.default.get(`SELECT COUNT(*) as count FROM land_parcels lp ${schoolFilter}`, params);
        const ownedParcels = await database_prod_1.default.get(`SELECT COUNT(*) as count FROM land_parcels lp ${schoolFilter} AND lp.owner_id IS NOT NULL`, params);
        const pendingRequests = await database_prod_1.default.get(`SELECT COUNT(*) as count FROM land_purchase_requests lpr WHERE ${schoolFilterLpr}`, params);
        const biomeStats = await database_prod_1.default.query(`SELECT lp.biome_type, COUNT(*) as count, 
              COUNT(lp.owner_id) as owned_count,
              AVG(lp.value) as avg_value
       FROM land_parcels lp
       ${schoolFilter}
       GROUP BY lp.biome_type`, params);
        const topOwnersParams = schoolId !== null ? [schoolId] : [];
        const topOwners = await database_prod_1.default.query(`SELECT u.username, u.first_name, u.last_name, 
              COUNT(lp.id) as parcel_count,
              SUM(lp.value) as total_value
       FROM land_parcels lp
       JOIN users u ON lp.owner_id = u.id
       ${schoolId !== null ? 'WHERE lp.school_id = $1' : 'WHERE lp.school_id IS NULL'}
       GROUP BY u.id, u.username, u.first_name, u.last_name
       ORDER BY parcel_count DESC
       LIMIT 10`, topOwnersParams);
        res.json({
            total_parcels: totalParcels?.count || 0,
            owned_parcels: ownedParcels?.count || 0,
            available_parcels: (totalParcels?.count || 0) - (ownedParcels?.count || 0),
            pending_requests: pendingRequests?.count || 0,
            biome_stats: biomeStats,
            top_owners: topOwners
        });
    }
    catch (error) {
        console.error('Failed to fetch land stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/land/biome-config - Get biome configuration
router.get('/biome-config', auth_1.authenticateToken, async (req, res) => {
    res.json(BIOME_CONFIG);
});
// POST /api/land/swap - Swap positions of two parcels (teachers only)
router.post('/swap', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), (0, express_validator_1.body)('parcel_id_a').isInt().toInt(), (0, express_validator_1.body)('parcel_id_b').isInt().toInt(), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { parcel_id_a, parcel_id_b } = req.body;
        if (parcel_id_a === parcel_id_b) {
            return res.status(400).json({ error: 'Cannot swap a parcel with itself' });
        }
        const schoolId = req.user?.school_id ?? null;
        const parcelA = await database_prod_1.default.get('SELECT id, row_index, col_index, grid_code, school_id FROM land_parcels WHERE id = $1', [parcel_id_a]);
        const parcelB = await database_prod_1.default.get('SELECT id, row_index, col_index, grid_code, school_id FROM land_parcels WHERE id = $1', [parcel_id_b]);
        if (!parcelA || !parcelB) {
            return res.status(404).json({ error: 'One or both parcels not found' });
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
        await database_prod_1.default.run('UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4', [-1, -1, '_temp_' + parcel_id_a, parcel_id_a]);
        await database_prod_1.default.run('UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4', [aRow, aCol, aCode, parcel_id_b]);
        await database_prod_1.default.run('UPDATE land_parcels SET row_index = $1, col_index = $2, grid_code = $3 WHERE id = $4', [bRow, bCol, bCode, parcel_id_a]);
        res.json({ message: 'Parcels swapped successfully' });
    }
    catch (error) {
        console.error('Failed to swap parcels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/land/recalculate-values - Recalculate parcel values for teacher's school (teachers only)
router.post('/recalculate-values', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? null;
        const parcels = schoolId !== null
            ? await database_prod_1.default.query('SELECT id, row_index, col_index, biome_type FROM land_parcels WHERE school_id = $1', [schoolId])
            : await database_prod_1.default.query('SELECT id, row_index, col_index, biome_type FROM land_parcels WHERE school_id IS NULL');
        let updated = 0;
        for (const p of parcels) {
            const biome = p.biome_type;
            const config = BIOME_CONFIG[biome];
            if (!config)
                continue;
            const row = Number(p.row_index);
            const col = Number(p.col_index);
            const valueVariation = 0.8 + (((row * col) % 100) / 250);
            const value = Math.round(config.baseValue * valueVariation);
            await database_prod_1.default.run('UPDATE land_parcels SET value = $1 WHERE id = $2', [value, p.id]);
            updated++;
        }
        res.json({ message: 'Land values recalculated', updated });
    }
    catch (error) {
        console.error('Failed to recalculate land values:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=land.js.map