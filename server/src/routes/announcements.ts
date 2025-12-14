import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get announcements (filtered by town_class if provided)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { town_class } = req.query;
    
    let query = `
      SELECT a.*, u.username as created_by_username
      FROM announcements a
      JOIN users u ON a.created_by = u.id
    `;
    const params: any[] = [];
    
    if (town_class && ['6A', '6B', '6C'].includes(town_class as string)) {
      query += ' WHERE a.town_class = $1';
      params.push(town_class);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const announcements = await database.query(query, params);
    res.json(announcements);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create announcement (teachers only)
router.post('/', 
  authenticateToken, 
  requireRole(['teacher']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('town_class').isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, town_class } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const result = await database.run(
        'INSERT INTO announcements (title, content, town_class, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [title, content, town_class, req.user.id]
      );

      const announcement = await database.get(
        'SELECT a.*, u.username as created_by_username FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.id = $1',
        [result.lastID]
      );

      res.status(201).json(announcement);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update announcement (teachers only)
router.put('/:id', 
  authenticateToken, 
  requireRole(['teacher']),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('town_class').optional().isIn(['6A', '6B', '6C']).withMessage('Town class must be 6A, 6B, or 6C')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const announcementId = parseInt(req.params.id);
      if (isNaN(announcementId)) {
        return res.status(400).json({ error: 'Invalid announcement ID' });
      }

      const announcement = await database.get('SELECT * FROM announcements WHERE id = $1', [announcementId]);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      const { title, content, town_class } = req.body;
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        params.push(content);
      }
      if (town_class !== undefined) {
        updates.push(`town_class = $${paramIndex++}`);
        params.push(town_class);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(announcementId);

      await database.run(
        `UPDATE announcements SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      );

      const updated = await database.get(
        'SELECT a.*, u.username as created_by_username FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.id = $1',
        [announcementId]
      );

      res.json(updated);
    } catch (error) {
      console.error('Failed to update announcement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete announcement (teachers only)
router.delete('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const announcementId = parseInt(req.params.id);
    if (isNaN(announcementId)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    const announcement = await database.get('SELECT * FROM announcements WHERE id = $1', [announcementId]);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await database.run('DELETE FROM announcements WHERE id = $1', [announcementId]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

