// server/server.js - FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== IMPORT MODELS =====
const Pet = require('./models/Pet');
const Product = require('./models/Product');

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow any *.onrender.com subdomain
    if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== SAFE ROUTE IMPORTS =====
const routes = {};

const safeImport = (name, path) => {
  try {
    routes[name] = require(path);
    console.log(`✅ Loaded ${name} routes`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Failed to load ${name} routes:`, error.message);
    return false;
  }
};

// Import all route modules
safeImport('pets', './routes/pets');
safeImport('products', './routes/products');
safeImport('cart', './routes/cart');
safeImport('contact', './routes/contact');
safeImport('users', './routes/users');
safeImport('auth', './routes/auth');
safeImport('admin', './routes/admin');
safeImport('images', './routes/images');
safeImport('news', './routes/news');

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI must be defined in your .env or Render settings.');
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Test the connection with a simple query
    try {
      const petCount = await Pet.countDocuments();
      const productCount = await Product.countDocuments();
      console.log(`📈 Database Stats: ${petCount} pets, ${productCount} products`);
    } catch (err) {
      console.log('📊 Database connected, but no data found (this is OK for new deployments)');
    }
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('🔧 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Connect to database
connectDB();

// ===== HEALTH CHECK ENDPOINT =====
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const loadedRoutes = Object.keys(routes);
    
    let petCount = 0;
    let productCount = 0;
    
    if (dbStatus === 'connected') {
      try {
        petCount = await Pet.countDocuments();
        productCount = await Product.countDocuments();
      } catch (err) {
        console.log('Database connected but unable to query collections');
      }
    }
    
    res.json({
      success: true,
      message: 'FurBabies Pet Store API is healthy!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        petCount,
        productCount
      },
      routes: {
        loaded: loadedRoutes,
        count: loadedRoutes.length
      },
      endpoints: {
        health: '/api/health',
        pets: '/api/pets',
        featuredPets: '/api/pets/featured?limit=4',
        debugSample: '/api/pets/debug/sample',
        products: '/api/products',
        featuredProducts: '/api/products/featured?limit=4',
        cart: '/api/cart',
        contact: 'POST /api/contact'
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

// ===== MOUNT ROUTES =====
// Mount routes with proper error handling
if (routes.pets) {
  app.use('/api/pets', routes.pets);
  console.log('🐕 Pets routes mounted at /api/pets');
} else {
  console.error('❌ Pets routes not available');
}

if (routes.products) {
  app.use('/api/products', routes.products);
  console.log('🛒 Products routes mounted at /api/products');
}

if (routes.cart) {
  app.use('/api/cart', routes.cart);
  console.log('🛒 Cart routes mounted at /api/cart');
}

if (routes.contact) {
  app.use('/api/contact', routes.contact);
  console.log('📧 Contact routes mounted at /api/contact');
}

if (routes.users) {
  app.use('/api/users', routes.users);
  console.log('👥 User routes mounted at /api/users');
}

if (routes.auth) {
  app.use('/api/auth', routes.auth);
  console.log('🔐 Auth routes mounted at /api/auth');
}

if (routes.admin) {
  app.use('/api/admin', routes.admin);
  console.log('⚙️ Admin routes mounted at /api/admin');
}

if (routes.images) {
  app.use('/api/images', routes.images);
  console.log('🖼️ Image routes mounted at /api/images');
}

if (routes.news) {
  app.use('/api/news', routes.news);
  console.log('📰 News routes mounted at /api/news');
}

// ===== DEVELOPMENT ROUTE =====
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({
      message: 'FurBabies Pet Store API - Development Mode',
      health: '/api/health',
      frontend: 'Run `npm run client` to start the React app on port 3000',
      availableRoutes: Object.keys(routes).map(route => `/api/${route}`)
    });
  });
}

// ===== 404 HANDLER FOR API ROUTES =====
app.use('/api/*', (req, res) => {
  const loadedRoutes = Object.keys(routes);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: loadedRoutes.map(route => `/api/${route}`),
    loadedRoutes: loadedRoutes,
    suggestion: 'Check /api/health for full endpoint list'
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
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 'Production URL' : `http://localhost:${PORT}`}`);
  console.log('📋 Available endpoints:');
  console.log('   🏠 Health: /api/health');
  
  Object.keys(routes).forEach(route => {
    console.log(`   📍 ${route}: /api/${route}`);
  });
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