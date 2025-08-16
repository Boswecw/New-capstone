// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not defined in environment variables');
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Log collection counts
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📚 Collections: ${collections.map(c => c.name).join(', ')}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// ===== API ROUTES =====
// Import route modules
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news'); // ← ADDED NEWS ROUTES

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount API routes
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes); // ← ADDED NEWS ROUTES

// Debug route to list all registered routes
if (process.env.NODE_ENV === 'development') {
  app.get('/api/routes', (req, res) => {
    const routes = [];
    
    function extractRoutes(stack, basePath = '') {
      stack.forEach(layer => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          routes.push({
            path: basePath + layer.route.path,
            methods
          });
        } else if (layer.name === 'router' && layer.handle.stack) {
          extractRoutes(layer.handle.stack, basePath + layer.regexp.source.replace(/[\\^$]/g, '').replace(/\?\(\?\=/g, ''));
        }
      });
    }
    
    extractRoutes(app._router.stack);
    
    const apiRoutes = routes
      .filter(r => r.path.includes('/api'))
      .sort((a, b) => a.path.localeCompare(b.path));
    
    res.json({
      success: true,
      count: apiRoutes.length,
      routes: apiRoutes
    });
  });
}

// ===== STATIC FILES (Production) =====
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// ===== ERROR HANDLING =====
// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 Server started successfully');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📋 Available endpoints:');
    console.log('  GET  /api/health');
    console.log('  GET  /api/pets');
    console.log('  GET  /api/pets/featured');
    console.log('  GET  /api/pets/:id');
    console.log('  GET  /api/products');
    console.log('  GET  /api/products/featured');
    console.log('  GET  /api/products/:id');
    console.log('  GET  /api/cart');
    console.log('  POST /api/cart/items');
    console.log('  PUT  /api/cart/items/:id');
    console.log('  DEL  /api/cart/items/:id');
    console.log('  GET  /api/news'); // ← ADDED
    console.log('  GET  /api/news/categories'); // ← ADDED
    console.log('  POST /api/news/refresh'); // ← ADDED
    console.log('  GET  /api/routes (debug)');
  }
});

module.exports = app;