import express from 'express';
import { dbRun, dbAll, dbGet } from '../database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, email, role, online, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await dbRun(
      'INSERT INTO users (username, email, password, role, online) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, true]
    );
    
    const user = await dbGet(
      'SELECT id, username, email, role, online, created_at FROM users WHERE id = ?',
      [result.id]
    );
    
    res.json(user);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update online status
    await dbRun('UPDATE users SET online = ? WHERE id = ?', [true, user.id]);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;