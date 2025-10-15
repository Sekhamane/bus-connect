import express from 'express';
import { dbRun, dbAll, dbGet } from '../database.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, price, image, vendor, category, description } = req.body;
    
    const result = await dbRun(
      'INSERT INTO products (name, price, image, vendor, category, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, image, vendor, category || 'General', description || '']
    );
    
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [result.id]);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;