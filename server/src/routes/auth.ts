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
  body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role }: CreateUserRequest = req.body;

    // Check if user already exists
    const existingUser = await database.get('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await database.run(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [username, passwordHash, role]
    );

    const userId = result.lastID;

    // Create bank account for student
    if (role === 'student') {
      const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await database.run(
        'INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)',
        [userId, accountNumber, 0.00]
      );
    }

    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

    // Get user data
    const user = await database.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = $1', [userId]);
    
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

    // Get account data for students
    let account = null;
    if (req.user.role === 'student') {
      account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
    }

    res.json({
      user: req.user,
      account
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
