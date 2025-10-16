import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection, initDatabase } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ADDED: JWT_SECRET validation for production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET is required in production!');
    process.exit(1);
  } else {
    process.env.JWT_SECRET = 'development-fallback-secret-change-in-production';
    console.warn('⚠️  Using development JWT secret');
  }
}

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://busconnect-front-end.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Database initialization endpoint
app.post('/api/init', async (req, res) => {
  try {
    await initDatabase();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BusConnect Backend Server is running!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL with Neon.tech',
    environment: process.env.NODE_ENV || 'development',
    endpoints: ['/api/health', '/api/test', '/api/users', '/api/products']
  });
});

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Backend is running perfectly!',
      database: dbConnected ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    status: 'success',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Users endpoints with database
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, online) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, role, online, created_at`,
      [username, email, passwordHash, role, true]
    );
    
    const user = result.rows[0];
    console.log('📝 User created:', user.username);
    
    // Generate JWT token - ✅ UPDATED: Uses validated JWT_SECRET
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      online: user.online,
      created_at: user.created_at,
      token: token
    });
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error.code === '23505') { // Unique violation
      if (error.constraint === 'users_username_key') {
        res.status(400).json({ error: 'Username already exists' });
      } else if (error.constraint === 'users_email_key') {
        res.status(400).json({ error: 'Email already exists' });
      }
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update user online status
    await pool.query(
      'UPDATE users SET online = true WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token - ✅ UPDATED: Uses validated JWT_SECRET
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🔐 User logged in:', user.username);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      online: true,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, online, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products endpoints with database
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username as vendor_name 
      FROM products p 
      LEFT JOIN users u ON p.vendor_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, image, vendor, category, description } = req.body;
    
    // Get vendor user ID
    const vendorResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [vendor]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const vendorId = vendorResult.rows[0].id;
    
    const result = await pool.query(
      `INSERT INTO products (name, price, image_url, vendor_id, category, description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, price, image, vendorId, category, description]
    );
    
    const product = result.rows[0];
    console.log('🛍️ Product created:', product.name);
    
    res.json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Checkins endpoints with database
app.get('/api/checkins', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.username as passenger_name 
      FROM checkins c 
      LEFT JOIN users u ON c.passenger_id = u.id 
      ORDER BY c.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/checkins', async (req, res) => {
  try {
    const { passenger_id, passenger_name, location } = req.body;
    
    const result = await pool.query(
      `INSERT INTO checkins (passenger_id, passenger_name, location) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [passenger_id, passenger_name, location]
    );
    
    const checkin = result.rows[0];
    console.log('📍 Checkin created for:', passenger_name);
    
    res.json(checkin);
  } catch (error) {
    console.error('Checkin creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Messages endpoints with database
app.get('/api/messages/:chatKey', async (req, res) => {
  try {
    const { chatKey } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_key = $1 ORDER BY timestamp ASC',
      [chatKey]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { chat_key, text, sender, sender_name } = req.body;
    
    // Get sender user ID
    const senderResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [sender_name]
    );
    
    const senderId = senderResult.rows.length > 0 ? senderResult.rows[0].id : null;
    
    const result = await pool.query(
      `INSERT INTO messages (chat_key, text, sender_id, sender_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [chat_key, text, senderId, sender_name]
    );
    
    const message = result.rows[0];
    console.log('💬 Message created in chat:', chat_key);
    
    res.json(message);
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Starting server without database connection');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
      console.log(`🗄️  Database: ${dbConnected ? 'Connected to PostgreSQL' : 'Not connected'}`);
      console.log(`🌐 CORS enabled for frontend`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();