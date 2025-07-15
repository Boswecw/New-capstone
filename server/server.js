// server/server.js - COMPLETE PRODUCTION VERSION WITH ENHANCED CORS
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
// const newsRoutes = require('./routes/news');
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// DATABASE CONNECTION
// ============================================
console.log('🚀 Starting FurBabies Pet Store Server...');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');

// Connect to MongoDB
connectDB();

// ============================================
// ENHANCED CORS CONFIGURATION
// ============================================

// Define allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://furbabies-frontend.onrender.com',     // Your main frontend
      'https://furbabies-petstore.onrender.com',     // Alternative naming
      'https://new-capstone-frontend.onrender.com',  // If using "new-capstone" naming
      // Add any additional production URLs here
      /https:\/\/furbabies.*\.onrender\.com$/,       // Allow Render preview URLs for your app
    ]
  : [
      'http://localhost:3000',      // React dev server
      'http://127.0.0.1:3000',     // Alternative localhost
      'http://localhost:3001',      // In case React runs on different port
      'http://localhost:8080',      // Alternative dev ports
      'http://localhost:4000',      // Common alternative
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      // Handle regex patterns
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  
  // Allow these HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allow these headers (important for JWT auth and file uploads)
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',           // For JWT tokens
    'Cache-Control',
    'X-File-Name',            // For file uploads
    'X-File-Size',            // For file uploads
    'X-File-Type'             // For file uploads
  ],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight requests for 24 hours (performance optimization)
  maxAge: 86400,
  
  // Include successful status for preflight
  optionsSuccessStatus: 200,
  
  // Expose these headers to the frontend
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// ============================================
// PREFLIGHT HANDLER (For complex requests)
// ============================================
app.options('*', (req, res) => {
  console.log(`✈️  Preflight request for ${req.path}`);
  res.status(200).end();
});

// ============================================
// ADDITIONAL MIDDLEWARE SETUP
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('Origin') || 'No Origin';
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${origin}`);
  next();
});

// CORS debugging (Development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' || req.get('Origin')) {
      console.log(`🌐 CORS Debug - Origin: ${req.get('Origin') || 'No Origin'}`);
      console.log(`🌐 CORS Debug - Method: ${req.method}`);
      if (req.get('Authorization')) {
        console.log(`🔑 Auth Header Present: ${req.get('Authorization').substring(0, 20)}...`);
      }
    }
    next();
  });
}

// ============================================
// HEALTH CHECK & STATUS ENDPOINTS
// ============================================
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'Disconnected',
    1: 'Connected', 
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: true,
    status: 'OK',
    message: 'FurBabies Server is running!',
    database: {
      status: dbStatusText[dbStatus] || 'Unknown',
      readyState: dbStatus,
      host: mongoose.connection.host || 'Not connected',
      name: mongoose.connection.name || 'Not connected'
    },
    server: {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    cors: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['Production origins configured'] 
        : allowedOrigins,
      credentials: true
    }
  });
});

// Debug endpoint for development
app.get('/api/debug', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Debug endpoint not available in production' });
  }
  
  res.json({
    success: true,
    message: 'FurBabies Debug Information',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
      PORT: PORT
    },
    cors: {
      allowedOrigins,
      currentOrigin: req.get('Origin') || 'No Origin',
      userAgent: req.get('User-Agent') ? req.get('User-Agent').substring(0, 50) + '...' : 'None'
    },
    routes: [
      'GET /api/health',
      'GET /api/debug',
      'GET /api/pets',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/news',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/profile'
    ],
    database: {
      status: mongoose.connection.readyState,
      collections: mongoose.connection.db ? 
        Object.keys(mongoose.connection.db.collections || {}) : []
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES - REAL ROUTES (NOT MOCK DATA)
// ============================================

// Route mounting with error handling
const mountRoute = (path, routeFile, description) => {
  try {
    const route = require(routeFile);
    app.use(path, route);
    console.log(`✅ ${description} mounted at ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to mount ${description} at ${path}:`, error.message);
    
    // Create a fallback error route
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        message: `${description} temporarily unavailable`,
        error: 'Route loading failed'
      });
    });
    return false;
  }
};

// Mount all API routes
console.log('\n📍 Mounting API routes...');
const routeResults = {
  pets: mountRoute('/api/pets', './routes/pets', 'Pets API'),
  products: mountRoute('/api/products', './routes/products', 'Products API'),
  // news: mountRoute('/api/news', './routes/news', 'News API'),
  users: mountRoute('/api/users', './routes/users', 'Users API'),
  admin: mountRoute('/api/admin', './routes/admin', 'Admin API')
};

// Report route mounting results
const successCount = Object.values(routeResults).filter(Boolean).length;
const totalRoutes = Object.keys(routeResults).length;
console.log(`\n🎯 Routes mounted successfully: ${successCount}/${totalRoutes}`);

if (successCount === 0) {
  console.error('🚨 CRITICAL: No routes mounted successfully!');
  console.error('🔍 Check that route files exist and have no syntax errors');
} else if (successCount < totalRoutes) {
  console.warn('⚠️  Some routes failed to mount. Check logs above for details.');
}

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.path} not found`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/products', 
      // 'GET /api/news',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/profile'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  
  // Handle CORS errors specifically
  if (err.message.includes('CORS policy violation')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    });
  }
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================
// STATIC FILES & FRONTEND (PRODUCTION)
// ============================================
if (process.env.NODE_ENV === 'production') {
  console.log('🎭 Production mode: Serving static React build files');
  
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Catch-all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../client/build', 'index.html');
    console.log(`📄 Serving React app for route: ${req.path}`);
    res.sendFile(indexPath);
  });
}

// ============================================
// SERVER STARTUP
// ============================================
const server = app.listen(PORT, () => {
  console.log('\n🎉 =====================================');
  console.log(`🚀 FurBabies Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Debug info: http://localhost:${PORT}/api/debug`);
    console.log(`🐾 Pets API: http://localhost:${PORT}/api/pets`);
    console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
  }
  
  console.log(`🔒 CORS configured for: ${allowedOrigins.length} origins`);
  console.log('🎉 =====================================\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ Express server closed');
    
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed');
      console.log('👋 FurBabies server shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('🚨 Shutting down server...');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  console.error('🚨 Shutting down server...');
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;