import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../types';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
  body('first_name').optional().custom((value) => {
    if (value && value.length < 1) {
      throw new Error('First name must be at least 1 character');
    }
    return true;
  }),
  body('last_name').optional().custom((value) => {
    if (value && value.length < 1) {
      throw new Error('Last name must be at least 1 character');
    }
    return true;
  }),
  body('class').optional().custom((value) => {
    if (value && !['6A', '6B', '6C'].includes(value)) {
      throw new Error('Class must be 6A, 6B, or 6C');
    }
    return true;
  }),
  body('email').optional().custom((value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('Valid email is required');
    }
    return true;
  }),
  body('email').optional().custom((value) => {
    if (value && !value.endsWith('@stpeters.co.za')) {
      throw new Error('Email must end with @stpeters.co.za');
    }
    return true;
  })
], async (req: Request, res: Response) => {
  try {
    console.log('🔍 Registration attempt:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role, first_name, last_name, class: studentClass, email }: CreateUserRequest = req.body;

    // Handle empty strings as null for optional fields
    const firstName = first_name && first_name.trim() ? first_name.trim() : null;
    const lastName = last_name && last_name.trim() ? last_name.trim() : null;
    const studentClassName = studentClass && studentClass.trim() ? studentClass.trim() : null;
    const emailAddress = email && email.trim() ? email.trim() : null;

    // Check if user already exists
    const existingUser = await database.get('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await database.run(
      'INSERT INTO users (username, password_hash, role, first_name, last_name, class, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [username, passwordHash, role, firstName, lastName, studentClassName, emailAddress]
    );

    const userId = result.lastID;

    // Create bank account for student
    if (role === 'student') {
      const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      console.log('🏦 Creating account for student:', userId, accountNumber);
      await database.run(
        'INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)',
        [userId, accountNumber, 0.00]
      );
      console.log('✅ Account created successfully');
    }

    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

    // Get user data
    const user = await database.get('SELECT id, username, role, first_name, last_name, class, email, created_at, updated_at FROM users WHERE id = $1', [userId]);
    
    // Get account data for students
    let account = null;
    if (role === 'student') {
      account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    }

    const response: AuthResponse = {
      token,
      user,
      account
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password }: LoginRequest = req.body;

    // Find user
    const user = await database.get('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // Get account data for students
    let account = null;
    if (user.role === 'student') {
      account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [user.id]);
    }

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      account
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user with job information
    const userWithJob = await database.get(
      `SELECT u.*, j.name as job_name, j.description as job_description, j.salary as job_salary
       FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    // Get account data for students
    let account = null;
    if (req.user.role === 'student') {
      account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
    }

    res.json({
      user: userWithJob,
      account
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
