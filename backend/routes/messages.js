import express from 'express';
import { dbRun, dbAll, dbGet } from '../database.js';

const router = express.Router();

// Get messages for a chat
router.get('/:chatKey', async (req, res) => {
  try {
    const { chatKey } = req.params;
    const messages = await dbAll(
      'SELECT * FROM messages WHERE chat_key = ? ORDER BY timestamp ASC',
      [chatKey]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create message
router.post('/', async (req, res) => {
  try {
    const { chat_key, text, sender, sender_name } = req.body;
    
    const result = await dbRun(
      'INSERT INTO messages (chat_key, text, sender, sender_name) VALUES (?, ?, ?, ?)',
      [chat_key, text, sender, sender_name]
    );
    
    const message = await dbGet('SELECT * FROM messages WHERE id = ?', [result.id]);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;