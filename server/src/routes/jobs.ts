import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// Helper function to calculate dynamic salary based on base_salary, job_level, and is_contractual
export function calculateJobSalary(baseSalary: number, jobLevel: number = 1, isContractual: boolean = false): number {
  // Level progression: base * (1 + (level - 1) * 0.7222)
  // Level 1: 100% of base (R2000)
  // Level 10: 750% of base (R15,000)
  // Each level increases by approximately 72.22%
  const levelMultiplier = 1 + (jobLevel - 1) * 0.7222;
  const contractualMultiplier = isContractual ? 1.5 : 1.0;
  const calculatedSalary = baseSalary * levelMultiplier * contractualMultiplier;
  return Math.round(calculatedSalary * 100) / 100; // Round to 2 decimal places
}

// Helper function to calculate XP needed for a specific level
// Level 1->2: 100 XP, each subsequent level requires more XP
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  // Cumulative XP: 100 * level * (level + 1) / 2 - 100
  // This gives: L2=100, L3=300, L4=600, L5=1000, L6=1500, L7=2100, L8=2800, L9=3600, L10=4500
  return 100 * level * (level + 1) / 2 - 100;
}

// Helper function to get XP needed for next level from current level
export function getXPNeededForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) return 0; // Max level
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - currentLevelXP;
}

// Get all jobs (with fulfillment status and assigned student name)
// Multi-tenant: return only global jobs (school_id IS NULL) or jobs for the user's school.
// Deduplicate by name: when both global and per-school row exist, prefer per-school.
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user?.school_id ?? null;
    if (schoolId !== null) {
      // One row per job name: prefer per-school over global when both exist
      const jobs = await database.query(
        `WITH preferred AS (
           SELECT DISTINCT ON (name) id
           FROM jobs
           WHERE school_id IS NULL OR school_id = $1
           ORDER BY name, (school_id = $1) DESC NULLS LAST, id
         )
         SELECT j.id, j.name, j.description, j.requirements, j.company_name, j.location, j.created_at, j.school_id,
                COALESCE(j.base_salary, 2000.00) as base_salary,
                COALESCE(j.is_contractual, false) as is_contractual,
                j.salary,
                COUNT(u.id)::int as assigned_count,
                (COUNT(u.id) > 0) as is_fulfilled,
                MIN(CASE WHEN u.id IS NOT NULL THEN
                  COALESCE(u.first_name || ' ' || u.last_name, u.username)
                END) as assigned_to_name
         FROM jobs j
         JOIN preferred p ON j.id = p.id
         LEFT JOIN users u ON j.id = u.job_id AND u.role = 'student'
         GROUP BY j.id, j.name, j.description, j.requirements, j.company_name, j.location, j.created_at, j.school_id, j.base_salary, j.is_contractual, j.salary
         ORDER BY j.created_at DESC`,
        [schoolId]
      );
      return res.json(jobs);
    }
    const jobs = await database.query(`
      SELECT j.id, j.name, j.description, j.requirements, j.company_name, j.location, j.created_at, j.school_id,
             COALESCE(j.base_salary, 2000.00) as base_salary,
             COALESCE(j.is_contractual, false) as is_contractual,
             j.salary,
             COUNT(u.id)::int as assigned_count,
             (COUNT(u.id) > 0) as is_fulfilled,
             MIN(CASE WHEN u.id IS NOT NULL THEN
               COALESCE(u.first_name || ' ' || u.last_name, u.username)
             END) as assigned_to_name
      FROM jobs j
      LEFT JOIN users u ON j.id = u.job_id AND u.role = 'student'
      GROUP BY j.id, j.name, j.description, j.requirements, j.company_name, j.location, j.created_at, j.school_id, j.base_salary, j.is_contractual, j.salary
      ORDER BY j.created_at DESC
    `);
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's application count (students only)
router.get('/my-applications/count', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const result = await database.get(
      `SELECT COUNT(*) as count 
       FROM job_applications 
       WHERE user_id = $1 AND status IN ('pending', 'approved')`,
      [req.user.id]
    );

    const count = parseInt(result?.count || '0');
    res.json({ count, maxApplications: 2, canApply: count < 2 });
  } catch (error) {
    console.error('Failed to fetch application count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// IMPORTANT: Static routes must come BEFORE parameterized routes
// Get applications (teachers only, school-scoped: only applicants from teacher's school)
router.get('/applications', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, job_id, user_id } = req.query;
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    let query = `
      SELECT ja.*, 
             u.username as applicant_username,
             u.first_name as applicant_first_name,
             u.last_name as applicant_last_name,
             u.class as applicant_class,
             j.name as job_name,
             COALESCE(j.base_salary, 2000.00) as job_salary,
             reviewer.username as reviewer_username
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (schoolId !== null) {
      query += ` AND u.school_id = $${paramIndex++}`;
      params.push(schoolId);
    }

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

// Get specific application (teachers only, same school as applicant)
router.get('/applications/:id', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    const application = await database.get(
      `SELECT ja.*, 
              u.username as applicant_username,
              u.first_name as applicant_first_name,
              u.last_name as applicant_last_name,
              u.class as applicant_class,
              j.name as job_name,
              COALESCE(j.base_salary, 2000.00) as job_salary,
              j.description as job_description,
              j.requirements as job_requirements,
              reviewer.username as reviewer_username
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
       WHERE ja.id = $1 ${schoolId !== null ? 'AND u.school_id = $2' : ''}`,
      schoolId !== null ? [applicationId, schoolId] : [applicationId]
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

// Update application status (teachers only, same school as applicant)
router.put('/applications/:id',
  authenticateToken,
  requireTenant,
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

      const schoolId = req.schoolId ?? req.user.school_id ?? null;
      const application = await database.get(
        `SELECT ja.* FROM job_applications ja
         JOIN users u ON ja.user_id = u.id
         WHERE ja.id = $1 ${schoolId !== null ? 'AND u.school_id = $2' : ''}`,
        schoolId !== null ? [applicationId, schoolId] : [applicationId]
      );
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
                COALESCE(j.base_salary, 2000.00) as job_salary,
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

// Get jobs with assignment counts per class (teachers only, school-scoped)
router.get('/assignments/overview', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { class: className } = req.query;
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;

    // Jobs: only global or for this school; count only students from this school
    // Include base_salary and is_contractual for dynamic salary calculation
    const jobsQuery = schoolId !== null
      ? `
      SELECT 
        j.id,
        j.name,
        j.description,
        COALESCE(j.base_salary, 2000.00) as base_salary,
        COALESCE(j.is_contractual, false) as is_contractual,
        COALESCE(j.base_salary, 2000.00) as salary,
        j.company_name,
        j.location,
        j.requirements,
        COUNT(CASE WHEN u.role = 'student' AND u.school_id = $1 THEN u.id END) as total_assigned,
        COUNT(CASE WHEN u.role = 'student' AND u.school_id = $1 AND u.class = $2 THEN u.id END) as class_assigned
      FROM jobs j
      LEFT JOIN users u ON j.id = u.job_id AND u.role = 'student' AND u.school_id = $1
      WHERE j.school_id IS NULL OR j.school_id = $1
      GROUP BY j.id, j.name, j.description, j.base_salary, j.is_contractual, j.company_name, j.location, j.requirements
      ORDER BY j.name
    `
      : `
      SELECT 
        j.id,
        j.name,
        j.description,
        COALESCE(j.base_salary, 2000.00) as base_salary,
        COALESCE(j.is_contractual, false) as is_contractual,
        COALESCE(j.base_salary, 2000.00) as salary,
        j.company_name,
        j.location,
        j.requirements,
        COUNT(CASE WHEN u.role = 'student' THEN u.id END) as total_assigned,
        COUNT(CASE WHEN u.role = 'student' AND u.class = $1 THEN u.id END) as class_assigned
      FROM jobs j
      LEFT JOIN users u ON j.id = u.job_id
      GROUP BY j.id, j.name, j.description, j.base_salary, j.is_contractual, j.company_name, j.location, j.requirements
      ORDER BY j.name
    `;
    const jobsParams = schoolId !== null ? [schoolId, className || null] : [className || null];
    const jobs = await database.query(jobsQuery, jobsParams);

    // Students: only from this school
    // Include job_level and calculate dynamic salary
    let studentsQuery = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.job_id,
        u.job_level,
        u.job_experience_points,
        j.name as job_name,
        COALESCE(j.base_salary, 2000.00) as base_salary,
        COALESCE(j.is_contractual, false) as is_contractual,
        -- Calculate dynamic salary: base * (1 + (level-1) * 0.7222) * (contractual ? 1.5 : 1.0)
        -- Level 1: 100% of base, Level 10: 750% of base (R15,000)
        (COALESCE(j.base_salary, 2000.00) * 
         (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * 
         CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary
      FROM users u
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.role = 'student'
    `;
    const studentsParams: any[] = [];
    let paramIndex = 1;
    if (schoolId !== null) {
      studentsQuery += ` AND u.school_id = $${paramIndex++}`;
      studentsParams.push(schoolId);
    }
    if (className && ['6A', '6B', '6C'].includes(className as string)) {
      studentsQuery += ` AND u.class = $${paramIndex++}`;
      studentsParams.push(className);
    }
    studentsQuery += ' ORDER BY u.class, u.last_name, u.first_name';

    const students = await database.query(studentsQuery, studentsParams);

    res.json({ jobs, students });
  } catch (error) {
    console.error('Failed to fetch job assignments overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup routes (must come BEFORE /:id so "setup" is not treated as job id)
// Add Assistant Software Engineer job (one-time setup - teachers only). Use canonical name to avoid duplicate with seed.
router.get('/setup/software-engineer',
  authenticateToken,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await database.run(
        `INSERT INTO jobs (name, description, base_salary, company_name, location, requirements, is_contractual)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (school_id, name) DO UPDATE SET
           description = EXCLUDED.description,
           base_salary = EXCLUDED.base_salary,
           company_name = EXCLUDED.company_name,
           location = EXCLUDED.location,
           requirements = EXCLUDED.requirements,
           is_contractual = EXCLUDED.is_contractual
         RETURNING id, name`,
        [
          'Assistant Software Engineer',
          'Daily: Check the Software Requests board (a list of problems learners want solved). Choose 1 task to work on or continue. Test the app with 1–2 users and capture feedback.\n\nWeekly: Bug hunt in CivicLab. Deliver one working micro-app or feature improvement. Publish it in the Town Hub as a "plugin" or tool link. Run a 2–3 minute demo to the class. Log: what problem it solves, how to use it, what changed after feedback.',
          2000.00,
          'Town Government / Tech Department',
          'Development Lab',
          null,
          false
        ]
      );

      const job = await database.get('SELECT * FROM jobs WHERE id = $1', [result.lastID]);
      res.json({
        success: true,
        message: 'Assistant Software Engineer job added or updated (R2,000 starting).',
        job
      });
    } catch (error) {
      console.error('Failed to add Assistant Software Engineer job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Add Risk & Insurance Manager and Entrepreneur jobs (one-time setup - teachers only)
router.get('/setup/risk-insurance-and-entrepreneur',
  authenticateToken,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobsToAdd = [
        {
          name: 'Assistant Risk & Insurance Manager',
          description: 'Daily: Review property insurance requests. Calculate premium based on risk. Approve or deny cover.\n\nWeekly: Assess biome risk levels. Update premium rates. Pay out claims after disasters. Report financial exposure to Finance.',
          company_name: 'Town Finance',
          location: 'Insurance Office',
          requirements: null
        },
        {
          name: 'Entrepreneur – Town Business Founder',
          description: 'Daily: Check sales. Adjust pricing. Track expenses. Respond to customer demand.\n\nWeekly: Launch product or service. Apply for investment or loan. Present pitch. Review profit/loss. Decide to expand or pivot.',
          company_name: 'Town Business',
          location: 'Town Market',
          requirements: 'Types of businesses they could start (keep it simple): Food stall; Tech service; Construction service; Tourism business; Transport service; Health products; Event service. Or linked to biome: Desert → solar company; Coastal → tourism; Grassland → agriculture; Forest → timber business.'
        }
      ];

      const baseSalary = 2000.00;
      const added: { id: number; name: string }[] = [];

      for (const job of jobsToAdd) {
        await database.run(
          `INSERT INTO jobs (name, description, base_salary, company_name, location, requirements, is_contractual)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (school_id, name) DO UPDATE SET
             description = EXCLUDED.description,
             base_salary = EXCLUDED.base_salary,
             company_name = EXCLUDED.company_name,
             location = EXCLUDED.location,
             requirements = EXCLUDED.requirements,
             is_contractual = EXCLUDED.is_contractual
           RETURNING id, name`,
          [job.name, job.description, baseSalary, job.company_name, job.location, job.requirements, false]
        );
        const row = await database.get('SELECT id, name FROM jobs WHERE name = $1 AND school_id IS NULL', [job.name]);
        if (row) added.push({ id: row.id, name: row.name });
      }

      res.json({
        success: true,
        message: 'Assistant Risk & Insurance Manager and Entrepreneur – Town Business Founder added (or updated). Refresh the Jobs board.',
        jobs: added
      });
    } catch (error) {
      console.error('Failed to add Risk & Insurance and Entrepreneur jobs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get job by ID (must come AFTER static routes like /applications, /setup/*; teacher/student only see global or their school's job)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    const schoolId = req.user?.school_id ?? null;

    const job = await database.get(
      `SELECT id, name, description, requirements, company_name, location, created_at, school_id,
              COALESCE(base_salary, 2000.00) as base_salary,
              COALESCE(is_contractual, false) as is_contractual,
              salary
       FROM jobs WHERE id = $1`,
      [jobId]
    );
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (schoolId !== null && job.school_id != null && job.school_id !== schoolId) {
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
      const job = await database.get(
        `SELECT id, name, description, requirements, company_name, location, created_at, school_id,
                COALESCE(base_salary, 2000.00) as base_salary,
                COALESCE(is_contractual, false) as is_contractual,
                salary
         FROM jobs WHERE id = $1`,
        [jobId]
      );
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check if job applications are enabled for this student's town/class
      if (req.user?.class && ['6A', '6B', '6C'].includes(req.user.class)) {
        const schoolId = req.user.school_id ?? null;
        const town = schoolId != null
          ? await database.get('SELECT job_applications_enabled FROM town_settings WHERE class = $1 AND school_id = $2', [req.user.class, schoolId])
          : await database.get('SELECT job_applications_enabled FROM town_settings WHERE class = $1 AND school_id IS NULL', [req.user.class]);
        
        if (town && town.job_applications_enabled === false) {
          return res.status(403).json({ error: 'Job applications are currently disabled. Please check back later.' });
        }
      }

      // Check if user has already applied to this specific job
      const existingApplication = await database.get(
        'SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2',
        [req.user.id, jobId]
      );

      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied to this job' });
      }

      // Check if user has reached the maximum of 2 applications (pending or approved only)
      const applicationCount = await database.get(
        `SELECT COUNT(*) as count 
         FROM job_applications 
         WHERE user_id = $1 AND status IN ('pending', 'approved')`,
        [req.user.id]
      );

      const count = parseInt(applicationCount?.count || '0');
      if (count >= 2) {
        return res.status(400).json({ 
          error: 'You have reached the maximum of 2 job applications. Please wait for a response on your existing applications before applying to more jobs.' 
        });
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


// Assign job to student (teachers only, student and job must be in teacher's school)
router.post('/assign',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [
    body('user_id').isInt().withMessage('User ID is required'),
    body('job_id').isInt().withMessage('Job ID is required')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, job_id } = req.body;
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      // Verify user is a student in this school
      const user = await database.get(
        'SELECT * FROM users WHERE id = $1 AND role = $2',
        [user_id, 'student']
      );
      if (!user) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (schoolId !== null && user.school_id !== schoolId) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Verify job exists and is global or for this school
      const job = await database.get('SELECT * FROM jobs WHERE id = $1', [job_id]);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      if (schoolId !== null && job.school_id != null && job.school_id !== schoolId) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Assign job - set job_id, job_level to 1 (entry level), and job_started_at
      await database.run(
        'UPDATE users SET job_id = $1, job_level = 1, job_experience_points = 0, job_started_at = CURRENT_TIMESTAMP WHERE id = $2',
        [job_id, user_id]
      );

      const updated = await database.get(
        `SELECT u.*, 
                j.name as job_name,
                COALESCE(j.base_salary, 2000.00) as base_salary,
                COALESCE(j.is_contractual, false) as is_contractual,
                -- Calculate dynamic salary: base * (1 + (level-1) * 0.7222) * (contractual ? 1.5 : 1.0)
                -- Level 1: 100% of base, Level 10: 750% of base (R15,000)
                (COALESCE(j.base_salary, 2000.00) * 
                 (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * 
                 CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary
         FROM users u 
         LEFT JOIN jobs j ON u.job_id = j.id 
         WHERE u.id = $1`,
        [user_id]
      );

      res.json(updated);
    } catch (error) {
      console.error('Failed to assign job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Remove job from student (teachers only, student must be in teacher's school)
router.delete('/assign/:user_id',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.user_id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      // Verify user is a student in this school
      const user = await database.get('SELECT * FROM users WHERE id = $1 AND role = $2', [userId, 'student']);
      if (!user) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (schoolId !== null && user.school_id !== schoolId) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Remove job assignment - also reset job level and experience
      await database.run(
        'UPDATE users SET job_id = NULL, job_level = 1, job_experience_points = 0, job_started_at = NULL WHERE id = $1',
        [userId]
      );

      res.json({ message: 'Job assignment removed successfully' });
    } catch (error) {
      console.error('Failed to remove job assignment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Award experience points to student (teachers only, student must be in teacher's school)
router.post('/award-xp',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  [
    body('user_id').isInt().withMessage('User ID is required'),
    body('xp_amount').isInt({ min: 1 }).withMessage('XP amount must be a positive integer')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, xp_amount } = req.body;
      const schoolId = req.schoolId ?? req.user?.school_id ?? null;

      // Verify user is a student in this school
      const user = await database.get('SELECT * FROM users WHERE id = $1 AND role = $2', [user_id, 'student']);
      if (!user) {
        return res.status(404).json({ error: 'Student not found' });
      }
      if (schoolId !== null && user.school_id !== schoolId) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (!user.job_id) {
        return res.status(400).json({ error: 'Student does not have a job assigned' });
      }

      // Get current level and XP
      const currentLevel = user.job_level || 1;
      const currentXP = user.job_experience_points || 0;
      const newXP = currentXP + xp_amount;

      // Calculate what level the student should be at with new XP
      let newLevel = currentLevel;
      for (let level = currentLevel; level < 10; level++) {
        const xpForNextLevel = getXPForLevel(level + 1);
        if (newXP >= xpForNextLevel) {
          newLevel = level + 1;
        } else {
          break;
        }
      }

      // Update user's XP and level
      await database.run(
        'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
        [newXP, newLevel, user_id]
      );

      // Get updated user with job info
      const updated = await database.get(
        `SELECT u.*, 
                j.name as job_name,
                COALESCE(j.base_salary, 2000.00) as base_salary,
                COALESCE(j.is_contractual, false) as is_contractual,
                -- Calculate dynamic salary: base * (1 + (level-1) * 0.7222) * (contractual ? 1.5 : 1.0)
                (COALESCE(j.base_salary, 2000.00) * 
                 (1 + (COALESCE(u.job_level, 1) - 1) * 0.7222) * 
                 CASE WHEN COALESCE(j.is_contractual, false) THEN 1.5 ELSE 1.0 END) as job_salary
         FROM users u 
         LEFT JOIN jobs j ON u.job_id = j.id 
         WHERE u.id = $1`,
        [user_id]
      );

      res.json({
        message: `Awarded ${xp_amount} XP${newLevel > currentLevel ? ` - Level up to ${newLevel}!` : ''}`,
        user: updated
      });
    } catch (error) {
      console.error('Failed to award XP:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update job (teachers only)
router.put('/:id',
  authenticateToken,
  requireRole(['teacher']),
  [
    body('name').optional().trim().notEmpty().withMessage('Job name cannot be empty'),
    body('description').optional().isString(),
    body('base_salary').optional().isFloat({ min: 0 }).withMessage('Base salary must be 0 or greater'),
    body('is_contractual').optional().isBoolean(),
    body('company_name').optional().isString(),
    body('location').optional().isString(),
    body('requirements').optional().isString()
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

      // Check if job exists
      const existingJob = await database.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
      if (!existingJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const { name, description, base_salary, company_name, location, requirements, is_contractual } = req.body;
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description || null);
      }
      if (base_salary !== undefined) {
        updates.push(`base_salary = $${paramIndex++}`);
        params.push(base_salary);
      }
      if (is_contractual !== undefined) {
        updates.push(`is_contractual = $${paramIndex++}`);
        params.push(is_contractual);
      }
      if (company_name !== undefined) {
        updates.push(`company_name = $${paramIndex++}`);
        params.push(company_name || null);
      }
      if (location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        params.push(location || null);
      }
      if (requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        params.push(requirements || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(jobId);
      await database.run(
        `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      );

      const updated = await database.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
      res.json(updated);
    } catch (error) {
      console.error('Failed to update job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

