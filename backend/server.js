// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ENHANCED CORS CONFIGURATION
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

// Root endpoint for basic testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'BusConnect Backend Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/health', '/api/test', '/api/users', '/api/products']
  });
});

// ... rest of your endpoints remain exactly the same ...

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ React app will be served from build folder`);
  console.log(`🌐 CORS enabled for: https://busconnect-front-end.onrender.com`);
});