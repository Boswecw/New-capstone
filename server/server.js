// server/server.js - FIXED FOR RENDER DEPLOYMENT
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// ✅ FIXED: Use the correct database config file that exists
const connectDB = require('../config/db');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// ===== ENVIRONMENT SETUP =====
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting FurBabies Pet Store Server...');
console.log(`📦 Environment: ${NODE_ENV}`);
console.log(`🌐 Port: ${PORT}`);
console.log('📁 Working Directory:', process.cwd());
console.log('📂 Server File:', __filename);

// ===== DATABASE CONNECTION =====
const initializeDatabase = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit on Render - let the service restart
    if (NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// ===== MIDDLEWARE SETUP =====
console.log('🛠️ Setting up middleware...');

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://new-capstone-frontend.onrender.com',
      'https://furbabies-petstore.onrender.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ===== ENHANCED ROUTE MOUNTING =====
const mountRoute = (path, routePath) => {
  try {
    console.log(`🔍 Attempting to mount route: ${path} from ${routePath}`);
    
    // Check if file exists before requiring
    const fs = require('fs');
    let fullPath;
    try {
      fullPath = require.resolve(routePath);
      console.log(`✅ Route file found: ${fullPath}`);
    } catch (resolveError) {
      throw new Error(`Route file not found: ${routePath}`);
    }
    
    // Require the route
    const route = require(routePath);
    console.log(`✅ Route required successfully: ${path}`);
    
    // Validate it's a proper Express router
    if (typeof route !== 'function') {
      throw new Error(`Route file ${routePath} does not export a valid Express router`);
    }
    
    // Mount the route
    app.use(path, route);
    console.log(`✅ Mounted route successfully: ${path}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to mount route ${path}:`);
    console.error(`   File: ${routePath}`);
    console.error(`   Error: ${error.message}`);
    
    // Create a fallback route that shows the error
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route ${path} failed to load`,
        error: error.message,
        debug: {
          routePath,
          timestamp: new Date().toISOString(),
          environment: NODE_ENV
        }
      });
    });
    
    return false;
  }
};

// ===== BASIC HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    success: true,
    status: 'OK',
    message: 'FurBabies server is running!',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT,
    uptime: process.uptime()
  });
});

// ===== MOUNT API ROUTES =====
console.log('🚀 Starting to mount API routes...');

const routeResults = {
  users: mountRoute('/api/users', './routes/users'),
  pets: mountRoute('/api/pets', './routes/pets'),
  products: mountRoute('/api/products', './routes/products'),
  admin: mountRoute('/api/admin', './routes/admin'),
  news: mountRoute('/api/news', './routes/news'),
  contact: mountRoute('/api/contact', './routes/contact'),
  webhooks: mountRoute('/api/webhooks', './routes/webhooks')
};

// Log mounting summary
console.log('📊 Route mounting summary:');
Object.entries(routeResults).forEach(([route, success]) => {
  console.log(`   ${success ? '✅' : '❌'} /api/${route}: ${success ? 'SUCCESS' : 'FAILED'}`);
});

const successCount = Object.values(routeResults).filter(Boolean).length;
const totalRoutes = Object.keys(routeResults).length;
console.log(`🎯 Routes mounted: ${successCount}/${totalRoutes}`);

if (successCount === 0) {
  console.error('🚨 CRITICAL: No routes mounted successfully!');
  console.error('🔍 Check that route files exist and have no syntax errors');
}

// ===== ROUTE DEBUGGING ENDPOINT =====
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Route debugging information',
    mountingResults: routeResults,
    availableRoutes: Object.keys(routeResults).filter(key => routeResults[key]).map(key => `/api/${key}`),
    failedRoutes: Object.keys(routeResults).filter(key => !routeResults[key]).map(key => `/api/${key}`),
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ===== SERVE STATIC FILES (FOR PRODUCTION) =====
if (NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  const buildPath = path.join(__dirname, '../client/build');
  console.log(`📁 Serving static files from: ${buildPath}`);
  
  app.use(express.static(buildPath));
  
  // Catch all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    console.log(`🌐 Serving React app for: ${req.path}`);
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // Development catch-all
  app.get('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path,
      method: req.method,
      availableRoutes: [
        'GET /api/health',
        'GET /api/debug/routes',
        ...Object.keys(routeResults).filter(key => routeResults[key]).map(key => `* /api/${key}`)
      ]
    });
  });
}

// ===== ERROR HANDLING MIDDLEWARE =====
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== START SERVER =====
const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ===================================');
      console.log('🚀 FurBabies Pet Store Server Started!');
      console.log('🎉 ===================================');
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🔗 Server URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🐛 Debug Routes: http://localhost:${PORT}/api/debug/routes`);
      console.log(`⚙️  Mounted Routes: ${successCount}/${totalRoutes}`);
      console.log('🎉 ===================================');
      console.log('');
      
      // Store server reference for graceful shutdown
      global.server = server;
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// ===== INITIALIZE APPLICATION =====
startServer();

module.exports = app;