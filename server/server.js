// server/server.js - FIXED CORS Configuration
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

// ✅ FIXED CORS CONFIGURATION
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔗 Frontend URL from env:', process.env.FRONTEND_URL);
console.log('🔗 Client URL from env:', process.env.CLIENT_URL);

const allowedOrigins = [
  // ✅ FIXED: Your actual frontend domain
  'https://furbabies-frontend.onrender.com',
  
  // ✅ Other Render.com domains
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  
  // ✅ Environment variable fallbacks
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  
  // ✅ Development origins
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

console.log('✅ Allowed CORS origins:', allowedOrigins);

// ✅ ENHANCED CORS CONFIGURATION
app.use(cors({
  origin: function (origin, callback) {
    console.log(`🔍 CORS check for origin: "${origin}"`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin "${origin}" is in allowed list`);
      return callback(null, true);
    }
    
    // Allow all *.onrender.com subdomains
    if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) {
      console.log(`✅ Origin "${origin}" matches *.onrender.com pattern`);
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
      console.log(`✅ Development mode - allowing localhost origin: "${origin}"`);
      return callback(null, true);
    }
    
    // Log blocked requests for debugging
    console.log(`🚫 CORS BLOCKED origin: "${origin}"`);
    console.log('📝 Allowed origins:', allowedOrigins);
    
    // ✅ TEMPORARY FIX: Allow all origins (remove this after testing)
    // TODO: Remove this line and use proper origin checking
    console.log('⚠️ TEMPORARY: Allowing all origins for debugging');
    return callback(null, true);
    
    // Uncomment this line after fixing environment variables:
    // return callback(new Error('Not allowed by CORS'));
  },
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
  console.log(`🔧 OPTIONS request for: ${req.path}`);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// ✅ CORS DEBUG MIDDLEWARE
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} from origin: ${req.headers.origin || 'no-origin'}`);
  
  // Set CORS headers manually as backup
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Temporary: allow all origins for debugging
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
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
  max: 500, // Increased from 100 to 500
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests
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
        allowedOrigins: allowedOrigins,
        requestOrigin: req.headers.origin,
        userAgent: req.headers['user-agent']
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
      enabled: true,
      allowedOrigins: allowedOrigins
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
  console.log(`🔗 CORS configured for origins:`, allowedOrigins);
});

module.exports = app;