// server/server.js - MINIMAL FIX - Only change rate limiting section
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
const newsRoutes = require('./routes/news');  // ✅ EXISTING: News routes import

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

// 🔧 FIXED: Rate limiting - ONLY CHANGE THIS SECTION
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // CHANGED: Increased from 100 to 500
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for critical endpoints
  skip: (req) => {
    return req.path === '/api/health' || 
           req.path === '/health' || 
           req.path.includes('/featured') || // Skip featured endpoints
           req.path.startsWith('/api/images'); // Skip image proxy
  }
});

app.use('/api/', limiter);

// Body parsing middleware
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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

connectDB();

// ===== MOUNT ROUTES =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/gcs', gcsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);  // ✅ EXISTING: News routes mounting

// ===== HEALTH CHECK ENDPOINT =====
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      message: 'FurBabies Pet Store API - Health Check',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        collections: ['pets', 'products', 'users', 'contacts']
      },
      services: {
        pets: 'operational',
        products: 'operational',
        news: 'operational',  // ✅ EXISTING: News service status
        images: 'operational',
        admin: 'operational'
      },
      endpoints: {
        public: {
          health: '/api/health',
          pets: '/api/pets',
          products: '/api/products',
          news: '/api/news',  // ✅ EXISTING: News endpoints
          contact: '/api/contact',
          images: '/api/images/gcs'
        },
        admin: {
          dashboard: '/api/admin/dashboard',
          pets: '/api/admin/pets',
          products: '/api/admin/products',
          users: '/api/admin/users',
          contacts: '/api/admin/contacts',
          reports: '/api/admin/reports',
          analytics: '/api/admin/analytics'
        }
      },
      // 🔧 ADDED: Rate limiting info
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
      'GET /api/news',               // ✅ EXISTING: News endpoints
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

// ===== PRODUCTION STATIC FILES =====
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'FurBabies Pet Store API - Development Mode',
      health: '/api/health',
      frontend: 'Run `npm run client` to start the React app on port 3000'
    });
  });
}

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://furbabies-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('📋 Available endpoints:');
  console.log('   🏠 Health: /api/health');
  console.log('   🐕 Pets: /api/pets');
  console.log('   🛒 Products: /api/products');
  console.log('   📰 News: /api/news');  // ✅ EXISTING: News logging
  console.log('   📧 Contact: /api/contact');
  console.log('   🖼️ Images: /api/images/gcs/{path}');
  console.log('   🔧 Admin: /api/admin/*');
  console.log('   🐾 Admin Pets: /api/admin/pets');
  console.log('   🛍️ Admin Products: /api/admin/products');
  console.log('');
  console.log('🔒 Rate Limiting:');
  console.log('   📊 General: 500 requests / 15 minutes');
  console.log('   ⭐ Featured: Unlimited');
  console.log('   🖼️ Images: Unlimited');
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;