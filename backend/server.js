// backend/server.js
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware - SIMPLE CORS
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running perfectly!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    status: 'success'
  });
});

// Users endpoints
app.post('/api/users', (req, res) => {
  try {
    console.log('📝 Creating user:', req.body);
    const user = {
      id: Date.now(),
      username: req.body.username,
      email: req.body.email,
      role: req.body.role || 'vendor',
      online: true,
      created_at: new Date().toISOString()
    };
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    const user = {
      id: Date.now(),
      username: req.body.email.split('@')[0],
      email: req.body.email,
      role: 'vendor',
      online: true
    };
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', (req, res) => {
  res.json([]);
});

// Products endpoints
app.get('/api/products', (req, res) => {
  res.json([]);
});

app.post('/api/products', (req, res) => {
  try {
    console.log('🛍️ Creating product:', req.body.name);
    const product = {
      id: Date.now(),
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      vendor: req.body.vendor,
      category: req.body.category || 'General',
      description: req.body.description || '',
      created_at: new Date().toISOString()
    };
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkins endpoints
app.get('/api/checkins', (req, res) => {
  res.json([]);
});

app.post('/api/checkins', (req, res) => {
  try {
    const checkin = {
      id: Date.now(),
      passenger_id: req.body.passenger_id,
      passenger_name: req.body.passenger_name,
      location: req.body.location,
      timestamp: new Date().toISOString()
    };
    res.json(checkin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messages endpoints
app.get('/api/messages/:chatKey', (req, res) => {
  res.json([]);
});

app.post('/api/messages', (req, res) => {
  try {
    const message = {
      id: Date.now(),
      chat_key: req.body.chat_key,
      text: req.body.text,
      sender: req.body.sender,
      sender_name: req.body.sender_name,
      timestamp: new Date().toISOString()
    };
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BACKEND SERVER RUNNING on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🛠️  API test: http://localhost:${PORT}/api/test`);
  console.log('📊 Ready to accept requests!');
});