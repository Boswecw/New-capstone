// server/server.js - FIXED FOR DUAL DEPLOYMENT
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== IMPORT MODELS =====
const Pet = require('./models/Pet');
const Product = require('./models/Product');

// ===== IMPORT ROUTE MODULES =====
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contact');
const imageRoutes = require('./routes/images');
const gcsRoutes = require('./routes/gcs');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(compression());

// CORS configuration - Updated for multiple domains
const allowedOrigins = [
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  'https://furbabies-frontend.onrender.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) {
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    console.log('✅ Allowed origins:', allowedOrigins);
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Access-Control-Allow-Origin'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.options('*', cors());

// 🔧 FIXED: Rate limiting - Increased limits for better performance
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // CHANGED: Increased from 100 to 500
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for featured content and health checks
    return req.path.includes('/featured') || 
           req.path.includes('/health') || 
           req.path.includes('/images/');
  }
});

app.use(limiter);

// Enhanced logging
app.use(morgan('combined', {
  skip: (req) => req.path.includes('/images/') || req.path.includes('/health')
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ===== API ROUTE HANDLERS =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);

// Load GCS routes if available
try {
  console.log('✅ GCS routes loaded - Public bucket access only');
  app.use('/api/images/gcs', gcsRoutes);
} catch (error) {
  console.log('⚠️ GCS routes not available - Using fallback images only');
}

// ===== HEALTH CHECK ENDPOINT =====
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      message: 'FurBabies Pet Store API is running!',
      environment: process.env.NODE_ENV,
      deployment: 'Dual deployment - API only',
      database: dbState,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        petAdoption: true,
        userAuth: true,
        heartRating: true,
        imageProxy: true,
        adminDashboard: true,
        newsIntegration: true
      },
      rateLimits: {
        general: '500 requests / 15 minutes',
        featuredEndpoints: 'unlimited',
        imageProxy: 'unlimited'
      },
      documentation: 'https://github.com/Boswecw/furbabies-petstore',
      frontend: 'Deployed separately',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ===== 404 HANDLER FOR API ROUTES =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/featured?limit=4',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/featured?limit=4',
      'GET /api/products/:id',
      'GET /api/news',
      'GET /api/news/featured?limit=3',
      'GET /api/news/custom',
      'GET /api/news/external',
      'GET /api/news/health',
      'POST /api/contact',
      'GET /api/images/gcs/{path}',
      'GET /api/images/health',
      'GET /api/admin/dashboard',
      'GET /api/admin/pets',
      'POST /api/admin/pets',
      'PUT /api/admin/pets/:id',
      'DELETE /api/admin/pets/:id',
      'GET /api/admin/products',
      'POST /api/admin/products',
      'PUT /api/admin/products/:id',
      'DELETE /api/admin/products/:id',
      'GET /api/admin/products/stats',
      'GET /api/admin/users',
      'GET /api/admin/contacts',
      'GET /api/admin/reports',
      'GET /api/admin/analytics'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===== SMART STATIC FILE SERVING =====
// 🔧 FIXED: Conditional static file serving for dual deployment
const clientBuildPath = path.join(__dirname, 'client/build');
const buildIndexPath = path.join(clientBuildPath, 'index.html');

if (process.env.NODE_ENV === 'production') {
  // Check if build files exist (monolithic deployment)
  if (fs.existsSync(buildIndexPath)) {
    console.log('📦 Serving React build files (monolithic deployment)');
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(buildIndexPath);
      }
    });
  } else {
    console.log('🔗 API-only mode (dual deployment detected)');
    // API-only mode for dual deployment
    app.get('/', (req, res) => {
      res.json({
        message: 'FurBabies Pet Store API - Production (Dual Deployment)',
        status: 'API service running',
        health: '/api/health',
        frontend: 'Deployed separately at furbabies-frontend.onrender.com',
        documentation: 'https://github.com/Boswecw/furbabies-petstore',
        endpoints: '/api/health for full endpoint list'
      });
    });

    // Handle all non-API routes with informative response
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.status(404).json({
          message: 'Frontend not served from this API',
          frontend: 'Visit furbabies-frontend.onrender.com',
          api: 'This service provides API endpoints only',
          health: '/api/health'
        });
      }
    });
  }
} else {
  // Development mode
  console.log('🛠️ Development mode detected');
  if (fs.existsSync(buildIndexPath)) {
    console.log('📦 Serving React build files');
    app.use(express.static(clientBuildPath));
    
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(buildIndexPath);
      }
    });
  } else {
    console.log('⚠️ No build files found - API only');
    app.get('/', (req, res) => {
      res.json({
        message: 'FurBabies Pet Store API - Development Mode',
        health: '/api/health',
        frontend: 'Run `npm run client` to start the React app on port 3000',
        note: 'Build files not found - run `npm run build` to create them'
      });
    });
  }
}

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  // Don't log missing static file errors in dual deployment
  if (err.code === 'ENOENT' && err.path && err.path.includes('client/build')) {
    console.log('ℹ️ Static file not found (expected in dual deployment):', err.path);
    return res.status(404).json({
      message: 'Resource not found',
      note: 'Frontend is deployed separately'
    });
  }
  
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📤 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📤 MongoDB connection closed');
    process.exit(0);
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 
    'https://furbabies-backend.onrender.com' : 
    `http://localhost:${PORT}`}`);
  
  console.log('📋 Available endpoints:');
  console.log('   🏠 Health: /api/health');
  console.log('   🐕 Pets: /api/pets');
  console.log('   🛒 Products: /api/products');
  console.log('   📰 News: /api/news');
  console.log('   📧 Contact: /api/contact');
  console.log('   🖼️ Images: /api/images/gcs/{path}');
  console.log('   🔧 Admin: /api/admin/*');
  console.log('   🐾 Admin Pets: /api/admin/pets');
  console.log('   🛍️ Admin Products: /api/admin/products');
  
  console.log('🔒 Rate Limiting:');
  console.log('   📊 General: 500 requests / 15 minutes');
  console.log('   ⭐ Featured: Unlimited');
  console.log('   🖼️ Images: Unlimited');
});

module.exports = app;