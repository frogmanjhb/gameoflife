import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import {
  AUCTION_BID_INCREMENTS,
  isAuctionBidIncrement,
  isTownClass,
  nextBidAmount,
  parseStartingPrice,
  sanitizeAuctionName,
  TownClass,
} from '../domain/auction';

const router = Router();

async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM auctions LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function getAuctionForSchool(id: number, schoolId: number | null) {
  if (schoolId != null) {
    return database.get('SELECT * FROM auctions WHERE id = $1 AND school_id = $2', [id, schoolId]);
  }
  return database.get('SELECT * FROM auctions WHERE id = $1 AND school_id IS NULL', [id]);
}

async function getHighBid(auctionId: number): Promise<{ amount: number; user_id: number; username?: string } | null> {
  const row = await database.get(
    `SELECT ab.amount, ab.user_id, u.username
     FROM auction_bids ab
     JOIN users u ON u.id = ab.user_id
     WHERE ab.auction_id = $1
     ORDER BY ab.amount DESC, ab.created_at ASC
     LIMIT 1`,
    [auctionId]
  );
  if (!row) return null;
  return {
    amount: parseFloat(row.amount),
    user_id: row.user_id,
    username: row.username,
  };
}

async function enrichAuction(auction: Record<string, unknown>) {
  const high = await getHighBid(auction.id as number);
  let winnerUsername: string | null = null;
  if (auction.winner_user_id) {
    const w = await database.get('SELECT username FROM users WHERE id = $1', [auction.winner_user_id]);
    winnerUsername = w?.username ?? null;
  }
  const starting = parseFloat(String(auction.starting_price));
  return {
    ...auction,
    starting_price: starting,
    winning_bid: auction.winning_bid != null ? parseFloat(String(auction.winning_bid)) : null,
    current_high_bid: high?.amount ?? null,
    current_high_bidder_user_id: high?.user_id ?? null,
    current_high_bidder_username: high?.username ?? null,
    display_high: high?.amount ?? starting,
    winner_username: winnerUsername,
  };
}

// GET /api/auction — list auctions for scope
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const schoolId = req.user.school_id ?? null;
    const isTeacher = req.user.role === 'teacher';

    let townClass: TownClass | null = null;
    if (isTeacher) {
      const q = req.query.class;
      if (q != null && q !== '') {
        if (!isTownClass(q)) {
          return res.status(400).json({ error: 'Invalid class. Use 6A, 6B, or 6C.' });
        }
        townClass = q;
      }
    } else {
      if (!isTownClass(req.user.class)) {
        return res.status(400).json({ error: 'Your account has no valid town class' });
      }
      townClass = req.user.class;
    }

    const params: unknown[] = [];
    let sql = `
      SELECT a.*,
             cu.username AS created_by_username,
             wu.username AS winner_username
      FROM auctions a
      LEFT JOIN users cu ON cu.id = a.created_by_user_id
      LEFT JOIN users wu ON wu.id = a.winner_user_id
      WHERE `;

    if (schoolId != null) {
      params.push(schoolId);
      sql += `a.school_id = $${params.length}`;
    } else {
      sql += `a.school_id IS NULL`;
    }

    if (townClass) {
      params.push(townClass);
      sql += ` AND a.town_class = $${params.length}`;
    }

    sql += ` ORDER BY
      CASE a.status WHEN 'live' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,
      a.created_at DESC`;

    const rows = await database.query(sql, params);
    const auctions = [];
    for (const row of rows) {
      auctions.push(await enrichAuction(row));
    }
    res.json({ auctions, town_class: townClass, bid_increments: AUCTION_BID_INCREMENTS });
  } catch (error) {
    console.error('Failed to list auctions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auction — teacher creates draft
router.post('/', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const name = sanitizeAuctionName(req.body?.name);
    if (!name) {
      return res.status(400).json({ error: 'Name is required (max 200 characters)' });
    }
    const startingPrice = parseStartingPrice(req.body?.starting_price);
    if (startingPrice == null) {
      return res.status(400).json({ error: 'Valid starting_price is required' });
    }
    if (!isTownClass(req.body?.town_class)) {
      return res.status(400).json({ error: 'town_class must be 6A, 6B, or 6C' });
    }
    const townClass = req.body.town_class as TownClass;
    const schoolId = req.user.school_id ?? null;

    const rows = await database.query(
      `INSERT INTO auctions (school_id, town_class, name, starting_price, status, created_by_user_id)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING *`,
      [schoolId, townClass, name, startingPrice, req.user.id]
    );
    const auction = await enrichAuction(rows[0]);
    res.status(201).json({ auction });
  } catch (error) {
    console.error('Failed to create auction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auction/:id — detail + recent bids
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid auction id' });
    }

    const schoolId = req.user.school_id ?? null;
    const auction = await getAuctionForSchool(id, schoolId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (req.user.role === 'student') {
      if (!isTownClass(req.user.class) || req.user.class !== auction.town_class) {
        return res.status(403).json({ error: 'This auction is for another town' });
      }
    }

    const bids = await database.query(
      `SELECT ab.id, ab.user_id, ab.amount, ab.created_at, u.username,
              u.first_name, u.last_name
       FROM auction_bids ab
       JOIN users u ON u.id = ab.user_id
       WHERE ab.auction_id = $1
       ORDER BY ab.amount DESC, ab.created_at ASC
       LIMIT 50`,
      [id]
    );

    res.json({
      auction: await enrichAuction(auction),
      bids: bids.map((b: Record<string, unknown>) => ({
        ...b,
        amount: parseFloat(String(b.amount)),
      })),
      bid_increments: AUCTION_BID_INCREMENTS,
    });
  } catch (error) {
    console.error('Failed to get auction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auction/:id/go-live
router.post('/:id/go-live', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid auction id' });
    }

    const schoolId = req.user.school_id ?? null;
    const auction = await getAuctionForSchool(id, schoolId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    if (auction.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft auctions can go live' });
    }

    let liveExists;
    if (schoolId != null) {
      liveExists = await database.get(
        `SELECT id FROM auctions WHERE school_id = $1 AND town_class = $2 AND status = 'live' AND id <> $3 LIMIT 1`,
        [schoolId, auction.town_class, id]
      );
    } else {
      liveExists = await database.get(
        `SELECT id FROM auctions WHERE school_id IS NULL AND town_class = $1 AND status = 'live' AND id <> $2 LIMIT 1`,
        [auction.town_class, id]
      );
    }
    if (liveExists) {
      return res.status(400).json({
        error: `There is already a live auction for town ${auction.town_class}. End it before going live with another.`,
      });
    }

    const rows = await database.query(
      `UPDATE auctions
       SET status = 'live', went_live_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    res.json({ auction: await enrichAuction(rows[0]) });
  } catch (error) {
    console.error('Failed to go live:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auction/:id/end
router.post('/:id/end', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid auction id' });
    }

    const schoolId = req.user.school_id ?? null;
    const auction = await getAuctionForSchool(id, schoolId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    if (auction.status !== 'live') {
      return res.status(400).json({ error: 'Only live auctions can be ended' });
    }

    const high = await getHighBid(id);
    const rows = await database.query(
      `UPDATE auctions
       SET status = 'ended',
           winner_user_id = $1,
           winning_bid = $2,
           ended_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [high?.user_id ?? null, high?.amount ?? null, id]
    );
    res.json({ auction: await enrichAuction(rows[0]) });
  } catch (error) {
    console.error('Failed to end auction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auction/:id/bid — student soft bid
router.post('/:id/bid', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!(await tablesReady())) {
      return res.status(503).json({ error: 'Auction tables not ready. Run migration.' });
    }
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid auction id' });
    }
    if (!isAuctionBidIncrement(req.body?.increment)) {
      return res.status(400).json({
        error: `increment must be one of: ${AUCTION_BID_INCREMENTS.join(', ')}`,
      });
    }
    const increment = Number(req.body.increment) as (typeof AUCTION_BID_INCREMENTS)[number];

    if (!isTownClass(req.user.class)) {
      return res.status(400).json({ error: 'Your account has no valid town class' });
    }

    const schoolId = req.user.school_id ?? null;
    const auction = await getAuctionForSchool(id, schoolId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    if (auction.status !== 'live') {
      return res.status(400).json({ error: 'Bidding is only open for live auctions' });
    }
    if (auction.town_class !== req.user.class) {
      return res.status(403).json({ error: 'This auction is for another town' });
    }

    const high = await getHighBid(id);
    if (high && high.user_id === req.user.id) {
      return res.status(400).json({ error: 'You are already the highest bidder' });
    }

    const base = high?.amount ?? parseFloat(String(auction.starting_price));
    const amount = nextBidAmount(base, increment);

    const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [req.user.id]);
    if (!account) {
      return res.status(400).json({ error: 'No bank account found' });
    }
    const balance = parseFloat(String(account.balance));
    if (balance < amount) {
      return res.status(400).json({
        error: `Insufficient funds. You need R${amount.toFixed(2)} available to place this bid (soft check — no money is deducted).`,
      });
    }

    await database.run(
      `INSERT INTO auction_bids (auction_id, user_id, amount) VALUES ($1, $2, $3)`,
      [id, req.user.id, amount]
    );

    const updated = await getAuctionForSchool(id, schoolId);
    res.json({
      success: true,
      bid_amount: amount,
      auction: await enrichAuction(updated!),
    });
  } catch (error) {
    console.error('Failed to place bid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
