// server/server.js - CLEANED VERSION
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

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI must be defined');
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

<<<<<<< HEAD
// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
=======
// ===== IMPORT MODELS =====
try {
  const Pet = require('./models/Pet');
  const Product = require('./models/Product');
  const User = require('./models/User');
  logger.info('Models imported successfully');
} catch (error) {
  logger.error('Failed to import models:', error.message);
  process.exit(1);
}

// ===== IMPORT ROUTE MODULES =====
let petRoutes, productRoutes, userRoutes, contactRoutes, imageRoutes, newsRoutes;

try {
  petRoutes = require('./routes/pets');
  productRoutes = require('./routes/products');
  userRoutes = require('./routes/users');
  contactRoutes = require('./routes/contact');
  imageRoutes = require('./routes/images');
  newsRoutes = require('./routes/news');
  logger.info('Route modules imported successfully');
} catch (error) {
  logger.error('Failed to import route modules:', error.message);
  process.exit(1);
}

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://storage.googleapis.com"],
      "connect-src": ["'self'", "https://api.stripe.com"],
    },
  },
}));

>>>>>>> 7147bbd10087f3d8c934a448e0fc622cfd9f09f1
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
const allowedOrigins = [
  'https://new-capstone.onrender.com',
  'https://furbabies-petstore.onrender.com',
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
    return callback(null, true); // Allow all for now, tighten in production
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== SAFE ROUTE IMPORTS =====
const routes = {};

const safeImport = (name, path) => {
  try {
    routes[name] = require(path);
    console.log(`✅ Loaded ${name} routes`);
  } catch (error) {
    console.warn(`⚠️ Failed to load ${name} routes:`, error.message);
  }
};

// Import available routes
safeImport('pets', './routes/pets');
safeImport('products', './routes/products');
safeImport('contact', './routes/contact');
safeImport('users', './routes/users');
safeImport('auth', './routes/auth');
safeImport('admin', './routes/admin');
safeImport('images', './routes/images');
safeImport('news', './routes/news');

// ===== HEALTH CHECK ROUTE =====
app.get('/api/health', (req, res) => {
  const loadedRoutes = Object.keys(routes);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    loadedRoutes: loadedRoutes,
    routeCount: loadedRoutes.length,
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

<<<<<<< HEAD
// Register routes
if (routes.pets) app.use('/api/pets', routes.pets);
if (routes.products) app.use('/api/products', routes.products);
if (routes.contact) app.use('/api/contact', routes.contact);
if (routes.users) app.use('/api/users', routes.users);
if (routes.auth) app.use('/api/auth', routes.auth);
if (routes.admin) app.use('/api/admin', routes.admin);
if (routes.images) app.use('/api/images', routes.images);
if (routes.news) app.use('/api/news', routes.news);
=======
// ===== API ROUTES =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/news', newsRoutes);
>>>>>>> 7147bbd10087f3d8c934a448e0fc622cfd9f09f1

// ===== PRODUCTION STATIC FILES =====
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    }
  });
}

// ===== ERROR HANDLING =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: Object.keys(routes).map(route => `/api/${route}`)
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

<<<<<<< HEAD
=======
// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Database event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

<<<<<<< HEAD
// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
=======
// Import available routes
safeImport('pets', './routes/pets');
safeImport('products', './routes/products');
safeImport('contact', './routes/contact');
safeImport('users', './routes/users');
safeImport('auth', './routes/auth');
safeImport('admin', './routes/admin');        // ✅ ADDED: Admin routes
safeImport('images', './routes/images');
safeImport('news', './routes/news');

// === HEALTH CHECK ROUTE ===
app.get('/api/health', (req, res) => {
  const loadedRoutes = Object.keys(routes);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    corsOrigins: corsOptions.origin,
    loadedRoutes: loadedRoutes,
    routeCount: loadedRoutes.length
>>>>>>> c526cf834a127180f3db7821387cb2e4631e039d
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

>>>>>>> 7147bbd10087f3d8c934a448e0fc622cfd9f09f1
// ===== START SERVER =====
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📁 Loaded Routes: ${Object.keys(routes).join(', ')}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

<<<<<<< HEAD
// Start the server
startServer();
=======
// Register routes only if they were successfully loaded
if (routes.pets) app.use('/api/pets', routes.pets);
if (routes.products) app.use('/api/products', routes.products);
if (routes.contact) app.use('/api/contact', routes.contact);
if (routes.users) app.use('/api/users', routes.users);
if (routes.auth) app.use('/api/auth', routes.auth);
if (routes.admin) app.use('/api/admin', routes.admin);    // ✅ ADDED: Admin route registration
if (routes.images) app.use('/api/images', routes.images);
if (routes.news) app.use('/api/news', routes.news);

// === SERVE STATIC FILES IN PRODUCTION ===
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// === 404 HANDLER ===
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 CORS Origins: ${JSON.stringify(corsOptions.origin)}`);
  console.log(`📁 Loaded Routes: ${Object.keys(routes).join(', ')}`);
});
>>>>>>> c526cf834a127180f3db7821387cb2e4631e039d

module.exports = app;