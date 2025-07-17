// server/server.js - UPDATED VERSION with Router Mounting
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

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(compression());

// CORS configuration - Updated for multiple domains
const allowedOrigins = [
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  'https://furbabies-frontend.onrender.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

// More robust CORS configuration for Render
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any *.onrender.com subdomain
    if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) {
      return callback(null, true);
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    console.log('✅ Allowed origins:', allowedOrigins);
    
    // For debugging, temporarily allow all origins (REMOVE IN PRODUCTION)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Access-Control-Allow-Origin'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Explicitly handle OPTIONS requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== MOUNT ROUTE MODULES (NEW SECTION) =====
// These handle the main routes that were causing 404s
app.use('/api/pets', petRoutes);           // 🎯 THIS FIXES BROWSE PAGE 404!
app.use('/api/products', productRoutes);   
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/gcs', gcsRoutes);

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    console.error('🔍 Available MongoDB env vars:', 
      Object.keys(process.env).filter(key => key.toLowerCase().includes('mongo')));
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
    const petCount = await Pet.countDocuments();
    const productCount = await Product.countDocuments();
    console.log(`📈 Database Stats: ${petCount} pets, ${productCount} products`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('🔧 Retrying connection in 5 seconds...');
    
    setTimeout(connectDB, 5000);
  }
};

// Connect to database
connectDB();

// ===== UTILITY FUNCTIONS =====
const addPetFields = (pet) => ({
  ...pet,
  imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
  fallbackImageUrl: '/api/images/fallback/pet'
});

const addProductFields = (product) => ({
  ...product,
  imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
  fallbackImageUrl: '/api/images/fallback/product'
});

// ===== HEALTH CHECK ENDPOINT =====
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const petCount = dbStatus === 'connected' ? await Pet.countDocuments() : 0;
    const productCount = dbStatus === 'connected' ? await Product.countDocuments() : 0;
    
    res.json({
      success: true,
      message: 'FurBabies Pet Store API is healthy!',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        pets: petCount,
        products: productCount
      },
      services: {
        imageProxy: 'enabled',
        cors: 'enabled',
        rateLimit: 'enabled'
      }
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ===== FEATURED PETS ENDPOINT (KEEP FOR HOME PAGE) =====
app.get('/api/pets/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🐕 GET /api/pets/featured - Limit: ${limit}`);

    const featuredPets = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $sample: { size: limit } }
    ]);

    const enrichedPets = featuredPets.map(addPetFields);

    console.log(`🐕 Returning ${enrichedPets.length} random featured pets`);
    
    res.json({
      success: true,
      data: enrichedPets,
      count: enrichedPets.length,
      message: `${enrichedPets.length} featured pets selected randomly`
    });

  } catch (error) {
    console.error('❌ Error fetching random featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// ===== FEATURED PRODUCTS ENDPOINT (KEEP FOR HOME PAGE) =====
app.get('/api/products/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🛒 GET /api/products/featured - Limit: ${limit}`);

    const featuredProducts = await Product.aggregate([
      { $match: { inStock: true } },
      { $sample: { size: limit } }
    ]);

    const enrichedProducts = featuredProducts.map(addProductFields);

    console.log(`🛒 Returning ${enrichedProducts.length} random featured products`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: `${enrichedProducts.length} featured products selected randomly`
    });

  } catch (error) {
    console.error('❌ Error fetching random featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// ===== FEATURED NEWS ENDPOINT (KEEP FOR HOME PAGE) =====
app.get('/api/news/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    console.log('📰 GET /api/news/featured - Mock news data');
    
    const mockNews = [
      {
        id: '1',
        title: 'New Pet Adoption Center Opens Downtown',
        summary: 'A state-of-the-art facility opens downtown to help more pets find loving homes.',
        category: 'adoption',
        author: 'FurBabies Team',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-01'),
        views: 1250,
        imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80'
      },
      {
        id: '2',
        title: 'Holiday Pet Safety Tips',
        summary: 'Keep your beloved pets safe during the holiday season with these essential safety tips.',
        category: 'safety', 
        author: 'Dr. Sarah Johnson',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-15'),
        views: 980,
        imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=400&fit=crop&q=80'
      },
      {
        id: '3',
        title: 'Success Story: Max Finds His Forever Home',
        summary: 'Follow Max\'s heartwarming journey from shelter to his loving forever family.',
        category: 'success-story',
        author: 'Maria Rodriguez', 
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-10'),
        views: 1567,
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&q=80'
      }
    ];
    
    const selectedNews = mockNews.slice(0, limit);
    
    res.json({
      success: true,
      data: selectedNews,
      count: selectedNews.length,
      message: `${selectedNews.length} featured news items retrieved`
    });

  } catch (error) {
    console.error('❌ Error fetching featured news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured news',
      error: error.message
    });
  }
});

// ===== PRODUCTION STATIC FILE SERVING =====
if (process.env.NODE_ENV === 'production') {
  // Serve API documentation at root
  app.get('/', (req, res) => {
    res.json({
      success: true,
      name: 'FurBabies Pet Store API',
      message: 'FurBabies Pet Store API - Backend Service',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        featuredPets: '/api/pets/featured?limit=4',
        featuredProducts: '/api/products/featured?limit=4',
        featuredNews: '/api/news/featured?limit=3',
        allPets: '/api/pets',
        allProducts: '/api/products',
        contact: 'POST /api/contact',
        images: '/api/images/gcs/{path}',
        storage: '/api/gcs/buckets/{bucket}/images'
      },
      documentation: 'https://github.com/Boswecw/furbabies-petstore',
      frontend: 'Deployed separately',
      timestamp: new Date().toISOString()
    });
  });

  // Catch-all for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.status(404).json({
        success: false,
        message: 'Backend-only service - Frontend deployed separately',
        requestedPath: req.path,
        apiDocumentation: '/api/health',
        availableEndpoints: [
          '/api/health',
          '/api/pets/featured',
          '/api/pets',
          '/api/products/featured',
          '/api/news/featured'
        ],
        timestamp: new Date().toISOString()
      });
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'FurBabies Pet Store API - Development Mode',
      health: '/api/health',
      frontend: 'Run `npm run client` to start the React app on port 3000'
    });
  });
}

// ===== 404 HANDLER FOR API ROUTES =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/featured?limit=4',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/featured?limit=4',
      'GET /api/products/:id',
      'GET /api/news/featured?limit=3',
      'POST /api/contact',
      'GET /api/images/gcs/{path}',
      'GET /api/images/health'
    ],
    timestamp: new Date().toISOString()
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
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://furbabies-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('📋 Available endpoints:');
  console.log('   🏠 Health: /api/health');
  console.log('   🐕 Pets: /api/pets');
  console.log('   🛒 Products: /api/products');
  console.log('   📧 Contact: /api/contact');
  console.log('   🖼️ Images: /api/images/gcs/{path}');
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