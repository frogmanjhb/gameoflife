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
// Get all jobs (with fulfillment status and assigned student name)
// Multi-tenant: return only global jobs (school_id IS NULL) or jobs for the user's school.
// Deduplicate by name: when both global and per-school row exist, prefer per-school.
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? null;
        if (schoolId !== null) {
            // One row per job name: prefer per-school over global when both exist
            const jobs = await database_prod_1.default.query(`WITH preferred AS (
           SELECT DISTINCT ON (name) id
           FROM jobs
           WHERE school_id IS NULL OR school_id = $1
           ORDER BY name, (school_id = $1) DESC NULLS LAST, id
         )
         SELECT j.*,
                COUNT(u.id)::int as assigned_count,
                (COUNT(u.id) > 0) as is_fulfilled,
                MIN(CASE WHEN u.id IS NOT NULL THEN
                  COALESCE(u.first_name || ' ' || u.last_name, u.username)
                END) as assigned_to_name
         FROM jobs j
         JOIN preferred p ON j.id = p.id
         LEFT JOIN users u ON j.id = u.job_id AND u.role = 'student'
         GROUP BY j.id
         ORDER BY j.created_at DESC`, [schoolId]);
            return res.json(jobs);
        }
        const jobs = await database_prod_1.default.query(`
      SELECT j.*,
             COUNT(u.id)::int as assigned_count,
             (COUNT(u.id) > 0) as is_fulfilled,
             MIN(CASE WHEN u.id IS NOT NULL THEN
               COALESCE(u.first_name || ' ' || u.last_name, u.username)
             END) as assigned_to_name
      FROM jobs j
      LEFT JOIN users u ON j.id = u.job_id AND u.role = 'student'
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);
        res.json(jobs);
    }
    catch (error) {
        console.error('Failed to fetch jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get student's application count (students only)
router.get('/my-applications/count', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const result = await database_prod_1.default.get(`SELECT COUNT(*) as count 
       FROM job_applications 
       WHERE user_id = $1 AND status IN ('pending', 'approved')`, [req.user.id]);
        const count = parseInt(result?.count || '0');
        res.json({ count, maxApplications: 2, canApply: count < 2 });
    }
    catch (error) {
        console.error('Failed to fetch application count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// IMPORTANT: Static routes must come BEFORE parameterized routes
// Get applications (teachers only)
router.get('/applications', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { status, job_id, user_id } = req.query;
        let query = `
      SELECT ja.*, 
             u.username as applicant_username,
             u.first_name as applicant_first_name,
             u.last_name as applicant_last_name,
             u.class as applicant_class,
             j.name as job_name,
             j.salary as job_salary,
             reviewer.username as reviewer_username
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (status && ['pending', 'approved', 'denied'].includes(status)) {
            query += ` AND ja.status = $${paramIndex++}`;
            params.push(status);
        }
        if (job_id) {
            const jobIdNum = parseInt(job_id);
            if (!isNaN(jobIdNum)) {
                query += ` AND ja.job_id = $${paramIndex++}`;
                params.push(jobIdNum);
            }
        }
        if (user_id) {
            const userIdNum = parseInt(user_id);
            if (!isNaN(userIdNum)) {
                query += ` AND ja.user_id = $${paramIndex++}`;
                params.push(userIdNum);
            }
        }
        query += ' ORDER BY ja.created_at DESC';
        const applications = await database_prod_1.default.query(query, params);
        res.json(applications);
    }
    catch (error) {
        console.error('Failed to fetch applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get specific application (teachers only)
router.get('/applications/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return res.status(400).json({ error: 'Invalid application ID' });
        }
        const application = await database_prod_1.default.get(`SELECT ja.*, 
              u.username as applicant_username,
              u.first_name as applicant_first_name,
              u.last_name as applicant_last_name,
              u.class as applicant_class,
              j.name as job_name,
              j.salary as job_salary,
              j.description as job_description,
              j.requirements as job_requirements,
              reviewer.username as reviewer_username
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users reviewer ON ja.reviewed_by = reviewer.id
       WHERE ja.id = $1`, [applicationId]);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json(application);
    }
    catch (error) {
        console.error('Failed to fetch application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update application status (teachers only)
router.put('/applications/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const application = await database_prod_1.default.get('SELECT * FROM job_applications WHERE id = $1', [applicationId]);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        const { status } = req.body;
        // Update application status
        await database_prod_1.default.run('UPDATE job_applications SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3', [status, req.user.id, applicationId]);
        // If approved, update user's job_id
        if (status === 'approved') {
            await database_prod_1.default.run('UPDATE users SET job_id = $1 WHERE id = $2', [application.job_id, application.user_id]);
        }
        const updated = await database_prod_1.default.get(`SELECT ja.*, 
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
         WHERE ja.id = $1`, [applicationId]);
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to update application status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get jobs with assignment counts per class (teachers only)
router.get('/assignments/overview', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { class: className } = req.query;
        // Get all jobs with assignment counts
        const jobs = await database_prod_1.default.query(`
      SELECT 
        j.id,
        j.name,
        j.description,
        j.salary,
        j.company_name,
        j.location,
        j.requirements,
        COUNT(CASE WHEN u.role = 'student' THEN u.id END) as total_assigned,
        COUNT(CASE WHEN u.role = 'student' AND u.class = $1 THEN u.id END) as class_assigned
      FROM jobs j
      LEFT JOIN users u ON j.id = u.job_id
      GROUP BY j.id, j.name, j.description, j.salary, j.company_name, j.location, j.requirements
      ORDER BY j.name
    `, [className || null]);
        // Get students with their jobs
        let studentsQuery = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.job_id,
        j.name as job_name
      FROM users u
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.role = 'student'
    `;
        const studentsParams = [];
        if (className && ['6A', '6B', '6C'].includes(className)) {
            studentsQuery += ' AND u.class = $1';
            studentsParams.push(className);
        }
        studentsQuery += ' ORDER BY u.class, u.last_name, u.first_name';
        const students = await database_prod_1.default.query(studentsQuery, studentsParams);
        res.json({ jobs, students });
    }
    catch (error) {
        console.error('Failed to fetch job assignments overview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get job by ID (must come AFTER static routes like /applications)
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }
        const job = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    }
    catch (error) {
        console.error('Failed to fetch job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Apply to a job
router.post('/:id/apply', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), [
    (0, express_validator_1.body)('answers').isObject().withMessage('Answers must be an object')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const job = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if job applications are enabled for this student's town/class
        if (req.user?.class && ['6A', '6B', '6C'].includes(req.user.class)) {
            const schoolId = req.user.school_id ?? null;
            const town = schoolId != null
                ? await database_prod_1.default.get('SELECT job_applications_enabled FROM town_settings WHERE class = $1 AND school_id = $2', [req.user.class, schoolId])
                : await database_prod_1.default.get('SELECT job_applications_enabled FROM town_settings WHERE class = $1 AND school_id IS NULL', [req.user.class]);
            if (town && town.job_applications_enabled === false) {
                return res.status(403).json({ error: 'Job applications are currently disabled. Please check back later.' });
            }
        }
        // Check if user has already applied to this specific job
        const existingApplication = await database_prod_1.default.get('SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2', [req.user.id, jobId]);
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this job' });
        }
        // Check if user has reached the maximum of 2 applications (pending or approved only)
        const applicationCount = await database_prod_1.default.get(`SELECT COUNT(*) as count 
         FROM job_applications 
         WHERE user_id = $1 AND status IN ('pending', 'approved')`, [req.user.id]);
        const count = parseInt(applicationCount?.count || '0');
        if (count >= 2) {
            return res.status(400).json({
                error: 'You have reached the maximum of 2 job applications. Please wait for a response on your existing applications before applying to more jobs.'
            });
        }
        // Create application
        const { answers } = req.body;
        const result = await database_prod_1.default.run('INSERT INTO job_applications (user_id, job_id, answers, status) VALUES ($1, $2, $3, $4) RETURNING id', [req.user.id, jobId, JSON.stringify(answers), 'pending']);
        const application = await database_prod_1.default.get('SELECT * FROM job_applications WHERE id = $1', [result.lastID]);
        res.status(201).json(application);
    }
    catch (error) {
        console.error('Failed to submit application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Assign job to student (teachers only)
router.post('/assign', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('user_id').isInt().withMessage('User ID is required'),
    (0, express_validator_1.body)('job_id').isInt().withMessage('Job ID is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { user_id, job_id } = req.body;
        // Verify user is a student
        const user = await database_prod_1.default.get('SELECT * FROM users WHERE id = $1 AND role = $2', [user_id, 'student']);
        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Verify job exists
        const job = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [job_id]);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Assign job
        await database_prod_1.default.run('UPDATE users SET job_id = $1 WHERE id = $2', [job_id, user_id]);
        const updated = await database_prod_1.default.get(`SELECT u.*, j.name as job_name, j.salary as job_salary 
         FROM users u 
         LEFT JOIN jobs j ON u.job_id = j.id 
         WHERE u.id = $1`, [user_id]);
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to assign job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Remove job from student (teachers only)
router.delete('/assign/:user_id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        // Verify user is a student
        const user = await database_prod_1.default.get('SELECT * FROM users WHERE id = $1 AND role = $2', [userId, 'student']);
        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Remove job assignment
        await database_prod_1.default.run('UPDATE users SET job_id = NULL WHERE id = $1', [userId]);
        res.json({ message: 'Job assignment removed successfully' });
    }
    catch (error) {
        console.error('Failed to remove job assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add Software Engineer job (one-time setup endpoint - teachers only)
// Can be accessed via GET request from browser
router.get('/setup/software-engineer', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const result = await database_prod_1.default.run(`INSERT INTO jobs (name, description, salary, company_name, location, requirements)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           salary = EXCLUDED.salary,
           company_name = EXCLUDED.company_name,
           location = EXCLUDED.location,
           requirements = EXCLUDED.requirements
         RETURNING id, name`, [
            'Software Engineer',
            'Daily: Check the Software Requests board (a list of problems learners want solved). Choose 1 task to work on or continue. Test the app with 1–2 users and capture feedback.\n\nWeekly: Bug hunt in the Game of Life. Deliver one working micro-app or feature improvement. Publish it in the Town Hub as a "plugin" or tool link. Run a 2–3 minute demo to the class. Log: what problem it solves, how to use it, what changed after feedback.',
            6000.00,
            'Town Government / Tech Department',
            'Development Lab',
            null
        ]);
        const job = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [result.lastID]);
        res.json({
            success: true,
            message: 'Software Engineer job added successfully!',
            job
        });
    }
    catch (error) {
        console.error('Failed to add Software Engineer job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update job (teachers only)
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), [
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Job name cannot be empty'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be 0 or greater'),
    (0, express_validator_1.body)('company_name').optional().isString(),
    (0, express_validator_1.body)('location').optional().isString(),
    (0, express_validator_1.body)('requirements').optional().isString()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }
        // Check if job exists
        const existingJob = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
        if (!existingJob) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const { name, description, salary, company_name, location, requirements } = req.body;
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(description || null);
        }
        if (salary !== undefined) {
            updates.push(`salary = $${paramIndex++}`);
            params.push(salary);
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
        await database_prod_1.default.run(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        const updated = await database_prod_1.default.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to update job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map