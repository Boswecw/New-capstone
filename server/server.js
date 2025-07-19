// server/server.js - NUCLEAR CORS FIX (Temporary)
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
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// 🚨 NUCLEAR CORS FIX - ALLOW ALL ORIGINS (TEMPORARY)
console.log('⚠️ NUCLEAR CORS FIX: Allowing ALL origins temporarily');
console.log('🌍 Environment:', process.env.NODE_ENV);

app.use(cors({
  origin: true,  // ⚠️ TEMPORARY: Allow ALL origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Cache-Control'
  ],
  exposedHeaders: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
}));

// ✅ EXPLICIT OPTIONS HANDLER
app.options('*', (req, res) => {
  console.log(`🔧 OPTIONS request for: ${req.path} from origin: ${req.headers.origin}`);
  res.header('Access-Control-Allow-Origin', '*');  // Allow all for testing
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// ✅ MANUAL CORS HEADERS (Backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`📡 ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  // Set permissive CORS headers
  res.header('Access-Control-Allow-Origin', '*');  // ⚠️ TEMPORARY: Allow all
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  
  next();
});

// ===== BODY PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== LOGGING =====
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for testing
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.method === 'OPTIONS';
  }
});

app.use('/api', limiter);

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// ===== API ROUTES =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/gcs', gcsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);

// ===== HEALTH CHECK =====
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
      cors: {
        status: 'NUCLEAR MODE - ALL ORIGINS ALLOWED',
        requestOrigin: req.headers.origin,
        userAgent: req.headers['user-agent'],
        warning: 'This is temporary for testing'
      }
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
      'GET /api/pets/featured',
      'GET /api/products',
      'GET /api/products/featured',
      'GET /api/news',
      'GET /api/news/featured'
    ]
  });
});

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.json({
    message: 'FurBabies Pet Store API - Production (Dual Deployment)',
    status: 'API service running',
    health: '/api/health',
    frontend: 'Deployed separately at furbabies-frontend.onrender.com',
    documentation: 'https://github.com/Boswecw/furbabies-petstore',
    cors: {
      status: 'NUCLEAR MODE - ALL ORIGINS ALLOWED',
      warning: 'This is temporary for testing'
    }
  });
});

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
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://new-capstone.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('⚠️ NUCLEAR CORS MODE: ALL ORIGINS ALLOWED (TEMPORARY)');
});

module.exports = app;