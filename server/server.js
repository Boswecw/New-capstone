// server/server.js - UPDATED with Admin Routes and proper CORS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

/**
 * ===== CORS (must come first) =====
 * Allow the deployed frontend + localhost for dev.
 * Also handle preflight and caching correctness with Vary: Origin.
 */
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'https://furbabies-frontend.onrender.com';

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5000',
  'https://new-capstone.onrender.com',
  FRONTEND_ORIGIN, // ✅ deployed frontend
  // Note: you generally do NOT need to whitelist your own backend origin
]);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) and whitelisted origins
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ ensure preflights succeed

// Set Vary: Origin for cache correctness
app.use((req, res, next) => {
  if (req.headers.origin) res.header('Vary', 'Origin');
  next();
});

/**
 * ===== Security middleware =====
 * Keep CSP disabled (as you had) or customize later.
 * crossOriginResourcePolicy set to 'cross-origin' to allow external images/CDNs.
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// ===== Compression for better performance =====
app.use(compression());

// ===== Request logging =====
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== Rate limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===== Body parsing middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(
      `🔗 Connection State: ${
        conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      }`
    );
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Monitor connection
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Reconnected');
});

// ===== IMPORT ROUTES =====
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin'); // ✅ ADDED ADMIN ROUTES
const newsRoutes = require('./routes/news');

// ===== BASIC ROUTES =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'FurBabies API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      pets: '/api/pets',
      products: '/api/products',
      cart: '/api/cart',
      users: '/api/users',
      auth: '/api/auth',
      contact: '/api/contact',
      admin: '/api/admin', // ✅ ADDED ADMIN ENDPOINT INFO
      news: '/api/news',
    },
  });
});

// ===== MOUNT API ROUTES =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes); // ✅ MOUNTED ADMIN ROUTES
app.use('/api/news', newsRoutes);

// Debug route to list all registered routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/routes', (req, res) => {
    const routes = [];

    function extractRoutes(stack, basePath = '') {
      stack.forEach((layer) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          routes.push({
            path: basePath + layer.route.path,
            methods,
          });
        } else if (layer.name === 'router' && layer.handle.stack) {
          const routerPath = layer.regexp.source
            .replace(/[\\^$]/g, '')
            .replace(/\?\(\?\=/g, '')
            .replace(/\$/, '');
          extractRoutes(layer.handle.stack, basePath + routerPath);
        }
      });
    }

    extractRoutes(app._router.stack);

    const apiRoutes = routes
      .filter((r) => r.path.includes('/api'))
      .sort((a, b) => a.path.localeCompare(b.path));

    res.json({
      success: true,
      count: apiRoutes.length,
      routes: apiRoutes,
    });
  });
}

// ===== STATIC FILES (Production) =====
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API route not found',
        path: req.path,
      });
    }

    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// ===== ERROR HANDLING =====
// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`⚠️ API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/pets',
      '/api/products',
      '/api/cart',
      '/api/users',
      '/api/auth',
      '/api/contact',
      '/api/admin',
      '/api/news',
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === 'development'
        ? { stack: err.stack, name: err.name }
        : undefined,
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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
    console.log('  GET  /api/users');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/register');
    console.log('  GET  /api/contact');
    console.log('  POST /api/contact');
    console.log('  GET  /api/admin/dashboard'); // ✅ ADDED ADMIN ENDPOINTS
    console.log('  GET  /api/admin/users');
    console.log('  GET  /api/admin/pets');
    console.log('  GET  /api/admin/products');
    console.log('  GET  /api/admin/contacts');
    console.log('  GET  /api/admin/analytics');
    console.log('  GET  /api/admin/settings');
    console.log('  GET  /api/admin/reports');
    console.log('  GET  /api/news');
    console.log('  GET  /api/news/categories');
    console.log('  POST /api/news/refresh');
    console.log('  GET  /api/routes (debug)');
  }
});

module.exports = app;
git 