// server/server.js - PRODUCTION READY VERSION
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

// ===== ENVIRONMENT VALIDATION =====
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// ===== LOGGING SETUP =====
const logger = {
  info: (message, ...args) => console.log(`ℹ️  ${new Date().toISOString()} - ${message}`, ...args),
  error: (message, ...args) => console.error(`❌ ${new Date().toISOString()} - ${message}`, ...args),
  warn: (message, ...args) => console.warn(`⚠️  ${new Date().toISOString()} - ${message}`, ...args),
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🐛 ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
};

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

app.use(compression());

// ===== REQUEST LOGGING =====
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ===== CORS CONFIGURATION =====
const allowedOrigins = [
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  'https://furbabies-frontend.onrender.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

// Add localhost for development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      logger.debug('CORS allowed for origin:', origin);
      return callback(null, true);
    }
    
    // Allow any *.onrender.com subdomain in production
    if (process.env.NODE_ENV === 'production' && origin.match(/https:\/\/.*\.onrender\.com$/)) {
      logger.debug('CORS allowed for Render subdomain:', origin);
      return callback(null, true);
    }
    
    // In development, allow localhost variations
    if (process.env.NODE_ENV !== 'production' && 
        (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      logger.debug('CORS allowed for development origin:', origin);
      return callback(null, true);
    }
    
    // Reject unauthorized origins
    logger.warn('CORS blocked origin:', origin);
    logger.debug('Allowed origins:', allowedOrigins);
    
    const error = new Error(`Origin ${origin} not allowed by CORS policy`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Explicitly handle preflight requests
app.options('*', cors());

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

app.use('/api/', limiter);

// ===== BODY PARSING MIDDLEWARE =====
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        message: 'Invalid JSON format'
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ===== TRUST PROXY =====
app.set('trust proxy', 1);

// ===== HEALTH CHECK ROUTES =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ===== API ROUTES =====
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/news', newsRoutes);

// ===== STATIC FILES (PRODUCTION) =====
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
    
    logger.info('Serving static files from:', buildPath);
  } else {
    logger.warn('Build directory not found:', buildPath);
  }
}

// ===== 404 HANDLER FOR API ROUTES =====
app.use('/api/*', (req, res) => {
  logger.warn(`404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((error, req, res, next) => {
  logger.error('Global error handler:', {
    message: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // CORS errors
  if (error.status === 403 && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

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

// ===== START SERVER =====
let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📱 Health check available at: http://localhost:${PORT}/health`);
      logger.info(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// ===== PROCESS EVENT HANDLERS =====
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
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