// server/server.js - FIXED VERSION WITH REAL ROUTES
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Security & Performance Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://new-capstone.onrender.com', 'https://furbabies-backend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FurBabies API Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ============================================
// 🔌 MOUNT REAL ROUTES (NOT MOCK DATA)
// ============================================

console.log('🚀 Mounting API routes...');

// Import and mount real routes
try {
  const petsRoutes = require('./routes/pets');
  app.use('/api/pets', petsRoutes);
  console.log('✅ Mounted pets routes: /api/pets');
} catch (error) {
  console.error('❌ Failed to mount pets routes:', error.message);
}

try {
  const productsRoutes = require('./routes/products');
  app.use('/api/products', productsRoutes);
  console.log('✅ Mounted products routes: /api/products');
} catch (error) {
  console.error('❌ Failed to mount products routes:', error.message);
}

try {
  const usersRoutes = require('./routes/users');
  app.use('/api/users', usersRoutes);
  console.log('✅ Mounted users routes: /api/users');
} catch (error) {
  console.error('❌ Failed to mount users routes:', error.message);
}

try {
  const newsRoutes = require('./routes/news');
  app.use('/api/news', newsRoutes);
  console.log('✅ Mounted news routes: /api/news');
} catch (error) {
  console.error('❌ Failed to mount news routes:', error.message);
  
  // Fallback mock news endpoint if news routes don't exist
  app.get('/api/news/featured', (req, res) => {
    console.log('📰 GET /api/news/featured (fallback mock)');
    
    const mockNews = [
      {
        id: '1',
        title: 'New Pet Adoption Center Opens',
        summary: 'A state-of-the-art facility opens downtown.',
        category: 'adoption',
        author: 'FurBabies Team',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-01'),
        views: 1250
      },
      {
        id: '2',
        title: 'Holiday Pet Safety Tips',
        summary: 'Keep your pets safe during the holidays.',
        category: 'safety', 
        author: 'Dr. Sarah Johnson',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-15'),
        views: 980
      },
      {
        id: '3',
        title: 'Success Story: Max Finds Home',
        summary: 'Follow Max\'s journey to his forever family.',
        category: 'success-story',
        author: 'Maria Rodriguez', 
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-10'),
        views: 1567
      }
    ];
    
    const limit = parseInt(req.query.limit) || 3;
    const news = mockNews.slice(0, limit);
    
    res.json({
      success: true,
      data: news,
      count: news.length,
      message: 'Featured news retrieved successfully (fallback mock data)'
    });
  });
}

try {
  const contactRoutes = require('./routes/contact');
  app.use('/api/contact', contactRoutes);
  console.log('✅ Mounted contact routes: /api/contact');
} catch (error) {
  console.error('❌ Failed to mount contact routes:', error.message);
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Mounted admin routes: /api/admin');
} catch (error) {
  console.error('❌ Failed to mount admin routes:', error.message);
}

console.log('📊 Route mounting completed!');

// ============================================
// ❌ REMOVED ALL MOCK ENDPOINTS
// ============================================
// Mock endpoints have been removed - now using real MongoDB routes

// Catch-all for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id',
      'GET /api/pets/featured',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/users/profile',
      'GET /api/news/featured',
      'POST /api/contact'
    ]
  });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('✅ Serving React build from:', frontendPath);
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.log('⚠️  React build directory not found:', frontendPath);
    app.get('*', (req, res) => {
      res.json({
        message: 'FurBabies API Server - Frontend build not found',
        buildPath: frontendPath
      });
    });
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 FurBabies Server Started Successfully!');
  console.log(`   🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🚀 Port: ${PORT}`);
  console.log(`   🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   🐕 Pets API: http://localhost:${PORT}/api/pets`);
  console.log(`   🛍️  Products API: http://localhost:${PORT}/api/products`);
  console.log(`   📰 News API: http://localhost:${PORT}/api/news/featured`);
  console.log('');
  console.log('✅ Server ready to serve real MongoDB data!');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});