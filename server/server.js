// server/server.js - Enhanced working version with image optimization
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

// ===== CHECK FOR IMAGE OPTIMIZATION =====
let sharpAvailable = false;
try {
  require('sharp');
  sharpAvailable = true;
  console.log('✅ Sharp image optimization library available');
} catch (error) {
  console.log('⚠️ Sharp not available - images will be served without optimization');
  console.log('💡 Install Sharp with: npm install sharp');
}

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
      mediaSrc: ["'self'", "https:", "http:", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }
}));

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Don't compress images as they're already compressed
    if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
      return compression.filter(req, res);
    }
    return false;
  }
}));

// ===== CORS CONFIGURATION (KEEP WORKING VERSION) =====
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
    'Access-Control-Allow-Origin',
    'Cache-Control',
    'If-None-Match',
    'If-Modified-Since'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'ETag',
    'Last-Modified',
    'X-Image-Source',
    'X-Image-Size',
    'X-Optimized',
    'X-Original-Size',
    'X-Optimized-Size',
    'X-Compression-Ratio'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Explicitly handle OPTIONS requests
app.options('*', cors());

// ===== ENHANCED RATE LIMITING =====
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for image requests in development
    return process.env.NODE_ENV === 'development' && req.path.includes('/api/images');
  }
});

const imageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for image requests
  message: {
    success: false,
    message: 'Too many image requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/images', imageLimiter);

// ===== LOGGING =====
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => {
      // Skip logging for successful image requests to reduce noise
      return req.path.includes('/api/images') && res.statusCode < 400;
    }
  }));
}

// ===== BODY PARSING MIDDLEWARE =====
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 50000
}));

// ===== TRUST PROXY =====
app.set('trust proxy', 1);

// ===== MOUNT ROUTE MODULES (KEEP WORKING ORDER) =====
app.use('/api/pets', petRoutes);           // 🎯 THIS FIXES BROWSE PAGE 404!
app.use('/api/products', productRoutes);   
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes);       // Enhanced with optimization
app.use('/api/gcs', gcsRoutes);

// ===== DATABASE CONNECTION (KEEP WORKING VERSION) =====
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
    
    // Use working connection options
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

// ===== MONGOOSE CONNECTION EVENTS =====
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose disconnected from MongoDB');
});

// Connect to database
connectDB();

// ===== UTILITY FUNCTIONS (ENHANCED) =====
const addPetFields = (pet) => ({
  ...pet,
  displayName: pet.name || 'Unnamed Pet',
  imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
  fallbackImageUrl: '/api/images/fallback/pet',
  ageDisplay: pet.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'} old` : 'Age unknown',
  statusDisplay: pet.status ? pet.status.charAt(0).toUpperCase() + pet.status.slice(1) : 'Unknown',
  locationDisplay: pet.location || 'Location not specified'
});

const addProductFields = (product) => ({
  ...product,
  displayName: product.name || 'Unnamed Product',
  imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
  fallbackImageUrl: '/api/images/fallback/product',
  priceDisplay: product.price ? `$${product.price.toFixed(2)}` : 'Price not available',
  categoryDisplay: product.category || 'Uncategorized',
  inStockDisplay: product.inStock !== false ? 'In Stock' : 'Out of Stock'
});

// ===== ENHANCED HEALTH CHECK ENDPOINT =====
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const petCount = dbStatus === 'connected' ? await Pet.countDocuments() : 0;
    const productCount = dbStatus === 'connected' ? await Product.countDocuments() : 0;
    
    const healthStatus = {
      success: true,
      message: 'FurBabies Pet Store API is healthy!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        imageOptimization: sharpAvailable ? 'available' : 'unavailable',
        imageProxy: 'enabled',
        cors: 'enabled',
        rateLimit: 'enabled',
        storage: 'available'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      database: {
        status: dbStatus,
        pets: petCount,
        products: productCount
      },
      endpoints: {
        health: '/api/health',
        pets: '/api/pets',
        products: '/api/products',
        users: '/api/users',
        contact: '/api/contact',
        images: '/api/images',
        gcs: '/api/gcs'
      }
    };
    
    res.json(healthStatus);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== FEATURED PETS ENDPOINT (KEEP WORKING VERSION) =====
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

// ===== FEATURED PRODUCTS ENDPOINT (KEEP WORKING VERSION) =====
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

// ===== FEATURED NEWS ENDPOINT (KEEP WORKING VERSION) =====
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

// ===== PRODUCTION STATIC FILE SERVING (ENHANCED) =====
if (process.env.NODE_ENV === 'production') {
  // Serve API documentation at root
  app.get('/', (req, res) => {
    res.json({
      success: true,
      name: 'FurBabies Pet Store API',
      message: 'FurBabies Pet Store API - Backend Service',
      version: '1.0.0',
      features: {
        imageOptimization: sharpAvailable ? 'enabled' : 'disabled',
        cors: 'enabled',
        rateLimit: 'enabled',
        compression: 'enabled',
        security: 'enabled'
      },
      endpoints: {
        health: '/api/health',
        featuredPets: '/api/pets/featured?limit=4',
        featuredProducts: '/api/products/featured?limit=4',
        featuredNews: '/api/news/featured?limit=3',
        allPets: '/api/pets',
        allProducts: '/api/products',
        contact: 'POST /api/contact',
        images: '/api/images/gcs/{path}',
        optimizedImages: '/api/images/gcs/{path}?w=300&h=250&q=80',
        presetImages: '/api/images/preset/{preset}/gcs/{path}',
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
          '/api/products',
          '/api/news/featured',
          '/api/images/gcs/{path}',
          '/api/images/preset/{preset}/gcs/{path}'
        ],
        timestamp: new Date().toISOString()
      });
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'FurBabies Pet Store API - Development Mode',
      imageOptimization: sharpAvailable ? 'enabled' : 'disabled',
      health: '/api/health',
      frontend: 'Run `npm run client` to start the React app on port 3000',
      endpoints: {
        health: '/api/health',
        pets: '/api/pets',
        products: '/api/products',
        images: '/api/images/gcs/{path}',
        optimized: '/api/images/gcs/{path}?w=300&h=250&q=80'
      }
    });
  });
}

// ===== 404 HANDLER FOR API ROUTES (ENHANCED) =====
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
      'GET /api/images/preset/{preset}/gcs/{path}',
      'GET /api/images/health',
      'GET /api/images/optimization/health'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  // Don't expose sensitive error details in production
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// ===== GRACEFUL SHUTDOWN (ENHANCED) =====
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  if (global.server) {
    global.server.close(() => {
      console.log('✅ HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  if (global.server) {
    global.server.close(() => {
      console.log('✅ HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  }
});

// ===== START SERVER =====
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`🖼️  Image Optimization: ${sharpAvailable ? 'Enabled' : 'Disabled'}`);
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://new-capstone.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('📋 Available endpoints:');
  console.log('   🏠 Health: /api/health');
  console.log('   🐕 Pets: /api/pets');
  console.log('   🛒 Products: /api/products');
  console.log('   📧 Contact: /api/contact');
  console.log('   🖼️ Images: /api/images/gcs/{path}');
  if (sharpAvailable) {
    console.log('   🎨 Optimized: /api/images/gcs/{path}?w=300&h=250&q=80');
    console.log('   📐 Presets: /api/images/preset/{preset}/gcs/{path}');
  }
});

// Keep reference to server for graceful shutdown
global.server = server;

module.exports = app;