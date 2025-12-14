import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all jobs
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await database.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await database.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Failed to fetch job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to a job
router.post('/:id/apply',
  authenticateToken,
  requireRole(['student']),
  [
    body('answers').isObject().withMessage('Answers must be an object')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if job exists
      const job = await database.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check if user has already applied
      const existingApplication = await database.get(
        'SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2',
        [req.user.id, jobId]
      );

      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied to this job' });
      }

      // Create application
      const { answers } = req.body;
      const result = await database.run(
        'INSERT INTO job_applications (user_id, job_id, answers, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [req.user.id, jobId, JSON.stringify(answers), 'pending']
      );

      const application = await database.get(
        'SELECT * FROM job_applications WHERE id = $1',
        [result.lastID]
      );

      res.status(201).json(application);
    } catch (error) {
      console.error('Failed to submit application:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get applications (teachers only)
router.get('/applications', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, job_id, user_id } = req.query;
    
    let query = `
      SELECT ja.*, 
             u.username as applicant_username,
             u.first_name as applicant_first_name,
             u.last_name as applicant_last_name,
             j.name as job_name,
             j.salary as job_salary,
             reviewer.username as reviewer_username
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status && ['pending', 'approved', 'denied'].includes(status as string)) {
      query += ` AND ja.status = $${paramIndex++}`;
      params.push(status);
    }

    if (job_id) {
      const jobIdNum = parseInt(job_id as string);
      if (!isNaN(jobIdNum)) {
        query += ` AND ja.job_id = $${paramIndex++}`;
        params.push(jobIdNum);
      }
    }

    if (user_id) {
      const userIdNum = parseInt(user_id as string);
      if (!isNaN(userIdNum)) {
        query += ` AND ja.user_id = $${paramIndex++}`;
        params.push(userIdNum);
      }
    }

    query += ' ORDER BY ja.created_at DESC';

    const applications = await database.query(query, params);
    res.json(applications);
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific application
router.get('/applications/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const application = await database.get(
      `SELECT ja.*, 
              u.username as applicant_username,
              u.first_name as applicant_first_name,
              u.last_name as applicant_last_name,
              j.name as job_name,
              j.salary as job_salary,
              j.description as job_description,
              j.requirements as job_requirements,
              reviewer.username as reviewer_username
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
       WHERE ja.id = $1`,
      [applicationId]
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Failed to fetch application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status (teachers only)
router.put('/applications/:id',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: 'Invalid application ID' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const application = await database.get('SELECT * FROM job_applications WHERE id = $1', [applicationId]);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const { status } = req.body;

      // Update application status
      await database.run(
        'UPDATE job_applications SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, req.user.id, applicationId]
      );

      // If approved, update user's job_id
      if (status === 'approved') {
        await database.run(
          'UPDATE users SET job_id = $1 WHERE id = $2',
          [application.job_id, application.user_id]
        );
      }

      const updated = await database.get(
        `SELECT ja.*, 
                u.username as applicant_username,
                u.first_name as applicant_first_name,
                u.last_name as applicant_last_name,
                j.name as job_name,
                j.salary as job_salary,
                reviewer.username as reviewer_username
         FROM job_applications ja
         JOIN users u ON ja.user_id = u.id
         JOIN jobs j ON ja.job_id = j.id
         LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
         WHERE ja.id = $1`,
        [applicationId]
      );

      res.json(updated);
    } catch (error) {
      console.error('Failed to update application status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

