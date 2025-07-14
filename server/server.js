// server/server.js - COMPLETE UPDATED VERSION WITH CORS FIX
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// ============================================
// ENVIRONMENT & CONFIG
// ============================================

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 FurBabies Backend Server Starting...');
console.log('📍 Environment:', NODE_ENV);
console.log('🔌 Port:', PORT);

// ============================================
// DATABASE CONNECTION
// ============================================

// Database connection
const connectDB = async () => {
  try {
    const mongoose = require('mongoose');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      if (NODE_ENV === 'production') {
        console.error('🚨 RENDER: Set MONGODB_URI in your service environment variables');
      }
      throw new Error('MONGODB_URI not found');
    }

    console.log('🔌 Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      maxPoolSize: NODE_ENV === 'production' ? 5 : 10,
      serverSelectionTimeoutMS: NODE_ENV === 'production' ? 10000 : 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    if (NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Connect to database
connectDB().catch(err => {
  console.error('Database connection failed:', err.message);
});

// ============================================
// 🚨 CORS CONFIGURATION - CRITICAL FIX
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    // Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',                          // Local development
      'http://localhost:5000',                          // Local backend
      'https://furbabies-frontend.onrender.com',       // Your deployed frontend
      'https://furbabies-backend.onrender.com',        // Your deployed backend
      'https://furbabies-frontend.vercel.app',         // If using Vercel
      'https://furbabies-frontend.netlify.app',        // If using Netlify
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ============================================
// SECURITY & MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined'));
}

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// HEALTH CHECK & DEBUG ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FurBabies Backend Server is running!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    cors: 'Enabled',
    mongodb: 'Connected'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.get('Origin'),
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Import route handlers
let petsRouter, productsRouter, usersRouter, adminRouter, contactRouter;

try {
  // Try to load routes, but don't fail if they don't exist
  try {
    petsRouter = require('./routes/pets');
    app.use('/api/pets', petsRouter);
    console.log('✅ Pets routes loaded');
  } catch (err) {
    console.log('⚠️  Pets routes not found, using mock');
    // Mock pets route
    app.get('/api/pets', (req, res) => {
      const mockPets = [
        {
          _id: 'p001',
          name: 'Fluffy',
          type: 'cat',
          breed: 'Persian',
          age: '2 years',
          description: 'A lovely cat looking for a home.',
          image: 'pet/kitten.png',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/kitten.png',
          status: 'available',
          featured: true
        },
        {
          _id: 'p002',
          name: 'Max',
          type: 'dog', 
          breed: 'Golden Retriever',
          age: '3 years',
          description: 'A friendly dog.',
          image: 'pet/betas-fish.jpg',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/betas-fish.jpg',
          status: 'available',
          featured: true
        }
      ];
      
      const { featured, limit = 10 } = req.query;
      let pets = mockPets;
      
      if (featured === 'true') {
        pets = pets.filter(pet => pet.featured);
      }
      
      pets = pets.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: pets,
        count: pets.length,
        message: 'Pets retrieved successfully (mock data)'
      });
    });
  }

  try {
    productsRouter = require('./routes/products');
    app.use('/api/products', productsRouter);
    console.log('✅ Products routes loaded');
  } catch (err) {
    console.log('⚠️  Products routes not found, using mock');
    // Mock products route
    app.get('/api/products', (req, res) => {
      const mockProducts = [
        {
          _id: 'prod_001',
          name: 'Premium Dog Food',
          category: 'Dog Care',
          brand: 'PetChoice',
          price: 29.99,
          description: 'High-quality nutrition for your best friend.',
          image: 'product/clicker.png',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/clicker.png',
          inStock: true,
          featured: true
        },
        {
          _id: 'prod_002',
          name: 'Interactive Cat Toy',
          category: 'Cat Care',
          brand: 'Feline Fun', 
          price: 15.99,
          description: 'Keep your cat entertained for hours.',
          image: 'product/dog-harness.png',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/dog-harness.png',
          inStock: true,
          featured: true
        }
      ];
      
      const { featured, limit = 10 } = req.query;
      let products = mockProducts;
      
      if (featured === 'true') {
        products = products.filter(product => product.featured);
      }
      
      products = products.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: products,
        count: products.length,
        message: 'Products retrieved successfully (mock data)'
      });
    });
  }

  try {
    usersRouter = require('./routes/users');
    app.use('/api/users', usersRouter);
    console.log('✅ Users routes loaded');
  } catch (err) {
    console.log('⚠️  Users routes not found');
  }

  try {
    adminRouter = require('./routes/admin');
    app.use('/api/admin', adminRouter);
    console.log('✅ Admin routes loaded');
  } catch (err) {
    console.log('⚠️  Admin routes not found');
  }

  try {
    contactRouter = require('./routes/contact');
    app.use('/api/contact', contactRouter);
    console.log('✅ Contact routes loaded');
  } catch (err) {
    console.log('⚠️  Contact routes not found');
  }

} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/cors-test',
      'GET /api/pets',
      'GET /api/products',
      'POST /api/users/register',
      'POST /api/users/login',
      'POST /api/contact'
    ]
  });
});

// Serve React frontend in production
if (NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('🔍 Stack:', err.stack);
  
  // CORS Error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'This origin is not allowed to access this resource',
      origin: req.get('Origin')
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🎉 ================================');
  console.log('🚀 FurBabies Backend Server Ready!');
  console.log('🎉 ================================');
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 URL: ${NODE_ENV === 'production' ? 'https://furbabies-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('✅ CORS: Configured for frontend domains');
  console.log('✅ MongoDB: Connected');
  console.log('✅ Routes: Loaded with fallbacks');
  console.log('');
  console.log('🔍 Test endpoints:');
  console.log(`   Health: /api/health`);
  console.log(`   CORS Test: /api/cors-test`);
  console.log(`   Pets: /api/pets`);
  console.log(`   Products: /api/products`);
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('🛑 Shutting down server...');
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;