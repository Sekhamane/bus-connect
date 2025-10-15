import express from 'express';
import { dbRun, dbAll, dbGet } from '../database.js';

const router = express.Router();

// Get all checkins
router.get('/', async (req, res) => {
  try {
    const checkins = await dbAll('SELECT * FROM checkins ORDER BY timestamp DESC');
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create checkin
router.post('/', async (req, res) => {
  try {
    const { passenger_id, passenger_name, location } = req.body;
    
    // Remove existing checkin for this passenger
    await dbRun('DELETE FROM checkins WHERE passenger_id = ?', [passenger_id]);
    
    const result = await dbRun(
      'INSERT INTO checkins (passenger_id, passenger_name, location) VALUES (?, ?, ?)',
      [passenger_id, passenger_name, location]
    );
    
    const checkin = await dbGet('SELECT * FROM checkins WHERE id = ?', [result.id]);
    res.json(checkin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;