// server/server.js - FIXED FOR RENDER DEPLOYMENT
const express = require('express');
const cors = require('cors');
const path = require('path');

// ✅ Use the robust database connection from config/db.js
const connectDB = require('../config/db');

const app = express();

// 🌐 Enhanced CORS configuration for Render
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://furbabies-frontend.onrender.com', // Your frontend URL
        'https://your-custom-domain.com' // Add your custom domain if you have one
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 🔧 Middleware setup
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔍 Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 🗃️ Connect to MongoDB using the enhanced config
console.log('🚀 Starting FurBabies API Server...');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');

// Initialize database connection
connectDB().catch(err => {
  console.error('❌ Failed to connect to database:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// 🔌 Route imports with error handling
let userRoutes, petRoutes, productRoutes, contactRoutes, adminRoutes, adminPetsRoutes;

try {
  userRoutes = require('./routes/users');
  petRoutes = require('./routes/pets');
  productRoutes = require('./routes/products');
  contactRoutes = require('./routes/contact');
  adminRoutes = require('./routes/admin');
  adminPetsRoutes = require('./routes/adminPets');
  console.log('✅ All route modules loaded successfully');
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  // Continue anyway - routes will be handled in the route mounting section
}

// 🛣️ API route mounting with fallback error handling
try {
  if (userRoutes) app.use('/api/users', userRoutes);
  if (petRoutes) app.use('/api/pets', petRoutes);
  if (productRoutes) app.use('/api/products', productRoutes);
  if (contactRoutes) app.use('/api/contact', contactRoutes);
  if (adminRoutes) app.use('/api/admin', adminRoutes);
  if (adminPetsRoutes) app.use('/api/admin/pets', adminPetsRoutes);
  console.log('✅ API routes mounted successfully');
} catch (error) {
  console.error('❌ Error mounting routes:', error.message);
}

// 📦 Serve static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🏥 Enhanced health check endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'FurBabies API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FurBabies API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🧪 Database connection status endpoint
app.get('/api/db-status', (req, res) => {
  const mongoose = require('mongoose');
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    database: {
      status: states[readyState] || 'unknown',
      readyState,
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected'
    },
    timestamp: new Date().toISOString()
  });
});

// 🚫 Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 🚨 Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 🌐 Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't exit on Render - let the service restart
  if (process.env.NODE_ENV !== 'production') {
    console.log('🛑 Shutting down server due to unhandled promise rejection');
    process.exit(1);
  }
});

// 🛑 Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Always exit on uncaught exceptions
  console.log('🛑 Shutting down server due to uncaught exception');
  process.exit(1);
});

// 🚀 Start the server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 ================================');
  console.log('🚀 FurBabies API Server Started!');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('📡 Port:', PORT);
  console.log('🔗 URL: http://0.0.0.0:' + PORT);
  console.log('🏥 Health: http://0.0.0.0:' + PORT + '/api/health');
  console.log('🗃️  DB Status: http://0.0.0.0:' + PORT + '/api/db-status');
  console.log('🎉 ================================');
  console.log('');
});

// 🛑 Graceful shutdown handling for Render
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed');
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;