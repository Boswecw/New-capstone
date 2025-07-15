// server/server.js - COMPLETE WORKING VERSION WITH CORS WORKAROUND
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== ENVIRONMENT SETUP =====
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('🚀 Starting FurBabies Backend Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://furbabies-frontend.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗃️ Database: ${conn.connection.db.databaseName}`);
    
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 RENDER: Check MONGODB_URI environment variable');
    }
    
    // Don't exit in production, let Render restart
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};

// ===== GOOGLE CLOUD STORAGE CORS WORKAROUND =====
const BUCKET_NAME = 'furbabies-petstore';

// Image proxy route to handle CORS
app.get('/api/images/*', async (req, res) => {
  try {
    const imagePath = req.params[0];
    const bucketUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${imagePath}`;
    
    console.log(`🖼️ Proxying image: ${imagePath}`);
    
    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=31536000' // 1 year cache
    });
    
    // Redirect to Google Cloud Storage with CORS headers
    res.redirect(302, bucketUrl);
    
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    res.status(404).json({
      success: false,
      message: 'Image not found',
      error: error.message
    });
  }
});

// Test image endpoint
app.get('/api/test-image/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  const imageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${folder}/${filename}`;
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    res.json({
      success: true,
      imageUrl,
      accessible: response.ok,
      status: response.status,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      }
    });
  } catch (error) {
    res.json({
      success: false,
      imageUrl,
      accessible: false,
      error: error.message
    });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  };
  
  console.log('🏥 Health check requested');
  res.json(healthStatus);
});

// ===== ROUTE MOUNTING =====
const mountRoute = (path, routePath, routeName) => {
  try {
    console.log(`🔍 Loading route: ${routeName} from ${routePath}`);
    const route = require(routePath);
    app.use(path, route);
    console.log(`✅ Mounted route: ${path} (${routeName})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to mount route ${routeName}:`, error.message);
    
    // Create error endpoint for debugging
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route ${routeName} failed to load`,
        error: error.message,
        path: routePath,
        timestamp: new Date().toISOString()
      });
    });
    
    return false;
  }
};

// Mount all routes
console.log('📂 Mounting API routes...');
const routes = [
  { path: '/api/pets', file: './routes/pets', name: 'Pets' },
  { path: '/api/products', file: './routes/products', name: 'Products' },
  { path: '/api/users', file: './routes/users', name: 'Users' },
  { path: '/api/admin', file: './routes/admin', name: 'Admin' },
  { path: '/api/news', file: './routes/news', name: 'News' },
  { path: '/api/contact', file: './routes/contact', name: 'Contact' }
];

let successCount = 0;
routes.forEach(({ path, file, name }) => {
  if (mountRoute(path, file, name)) {
    successCount++;
  }
});

console.log(`🎯 Routes mounted: ${successCount}/${routes.length}`);

// ===== DEBUG ROUTES =====
app.get('/api/debug/routes', (req, res) => {
  const routeInfo = {
    success: true,
    message: 'FurBabies API Debug Information',
    environment: process.env.NODE_ENV,
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    routes: {
      mounted: successCount,
      total: routes.length,
      available: [
        'GET /api/health',
        'GET /api/pets',
        'GET /api/products',
        'GET /api/users',
        'GET /api/news',
        'GET /api/images/:folder/:filename',
        'GET /api/debug/routes'
      ]
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(routeInfo);
});

// ===== ERROR HANDLING =====
// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/products',
      'GET /api/users',
      'GET /api/news/featured',
      'GET /api/images/{folder}/{filename}',
      'GET /api/debug/routes'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Global error handler:', err);
  
  const errorResponse = {
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// ===== STATIC FILES (PRODUCTION) =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  
  // Check if build directory exists
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    console.log(`📁 Serving static files from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    
    // Catch-all handler for React Router
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn('⚠️ Frontend build directory not found');
    app.get('*', (req, res) => {
      res.json({
        message: 'FurBabies API Server',
        status: 'API Only - Frontend build not found',
        endpoints: '/api/health'
      });
    });
  }
}

// ===== SERVER STARTUP =====
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 ===== FURBABIES SERVER STARTED =====');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🗃️ Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log(`📂 Routes: ${successCount}/${routes.length} mounted`);
      console.log(`🖼️ Images: CORS workaround enabled`);
      console.log('');
      console.log('🔗 Available endpoints:');
      console.log(`   Health: /api/health`);
      console.log(`   Pets: /api/pets`);
      console.log(`   Products: /api/products`);
      console.log(`   Images: /api/images/{folder}/{filename}`);
      console.log(`   Debug: /api/debug/routes`);
      console.log('');
      console.log('✅ Server is ready for requests!');
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();