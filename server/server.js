// server/server.js - Enhanced with Image Optimization Middleware
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

// Import models
const Pet = require('./models/Pet');
const Product = require('./models/Product');
const User = require('./models/User');
const Contact = require('./models/Contact');

// Import routes
const userRoutes = require('./routes/users');
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');
const imageRoutes = require('./routes/images');
const gcsRoutes = require('./routes/gcs');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===== SECURITY & PERFORMANCE MIDDLEWARE =====
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

// ===== CORS CONFIGURATION =====
const allowedOrigins = [
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  'https://furbabies-frontend.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Add regex for any Render subdomain
allowedOrigins.push(/https:\/\/.*\.onrender\.com$/);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
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
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ===== RATE LIMITING =====
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
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      bufferMaxEntries: 0
    });

    console.log('✅ MongoDB connected successfully');
    
    // Log database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Available collections: ${collections.map(c => c.name).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// ===== MIDDLEWARE FOR IMAGE OPTIMIZATION =====
// Check if Sharp is available for image optimization
let sharpAvailable = false;
try {
  require('sharp');
  sharpAvailable = true;
  console.log('✅ Sharp image optimization library available');
} catch (error) {
  console.log('⚠️ Sharp not available - images will be served without optimization');
  console.log('💡 Install Sharp with: npm install sharp');
}

// ===== UTILITY FUNCTIONS =====
const addPetFields = (pet) => {
  const enrichedPet = {
    ...pet,
    displayName: pet.name || 'Unnamed Pet',
    imageUrl: pet.image || pet.imageUrl || null,
    ageDisplay: pet.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'} old` : 'Age unknown',
    statusDisplay: pet.status ? pet.status.charAt(0).toUpperCase() + pet.status.slice(1) : 'Unknown',
    locationDisplay: pet.location || 'Location not specified'
  };
  
  return enrichedPet;
};

const addProductFields = (product) => {
  const enrichedProduct = {
    ...product,
    displayName: product.name || 'Unnamed Product',
    imageUrl: product.image || product.imageUrl || null,
    priceDisplay: product.price ? `$${product.price.toFixed(2)}` : 'Price not available',
    categoryDisplay: product.category || 'Uncategorized',
    inStockDisplay: product.inStock !== false ? 'In Stock' : 'Out of Stock'
  };
  
  return enrichedProduct;
};

// ===== HEALTH CHECK WITH ENHANCED MONITORING =====
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'disconnected',
        imageOptimization: sharpAvailable ? 'available' : 'unavailable',
        storage: 'available'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      endpoints: {
        health: '/api/health',
        pets: '/api/pets',
        products: '/api/products',
        users: '/api/users',
        contact: '/api/contact',
        images: '/api/images',
        admin: '/api/admin'
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthStatus.services.database = 'connected';
      
      // Get database stats
      try {
        const [petCount, productCount, userCount] = await Promise.all([
          Pet.countDocuments(),
          Product.countDocuments(),
          User.countDocuments()
        ]);
        
        healthStatus.database = {
          pets: petCount,
          products: productCount,
          users: userCount
        };
      } catch (dbError) {
        console.warn('Database stats error:', dbError.message);
        healthStatus.services.database = 'connected (stats unavailable)';
      }
    }

    res.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== FEATURED CONTENT ENDPOINTS =====
app.get('/api/pets/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🐾 GET /api/pets/featured - Limit: ${limit}`);
    
    const pets = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $sample: { size: limit } }
    ]);

    const enrichedPets = pets.map(addPetFields);
    
    console.log(`🐾 Found ${enrichedPets.length} featured pets`);
    
    res.json({
      success: true,
      data: enrichedPets,
      message: `${enrichedPets.length} featured pets retrieved successfully`
    });
  } catch (error) {
    console.error('❌ Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured pets',
      error: error.message
    });
  }
});

app.get('/api/products/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🛒 GET /api/products/featured - Limit: ${limit}`);
    
    const products = await Product.aggregate([
      { $match: { inStock: { $ne: false } } },
      { $sample: { size: limit } }
    ]);

    const enrichedProducts = products.map(addProductFields);
    
    console.log(`🛒 Found ${enrichedProducts.length} featured products`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      message: `${enrichedProducts.length} featured products retrieved successfully`
    });
  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
});

// ===== MAIN API ROUTES =====
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/images', imageRoutes); // Enhanced with optimization middleware
app.use('/api/gcs', gcsRoutes);
app.use('/api/admin', adminRoutes);

// ===== INDIVIDUAL RESOURCE ENDPOINTS =====
app.get('/api/pets/:id', async (req, res) => {
  try {
    console.log('🐾 GET /api/pets/:id - Pet ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found"
      });
    }

    // Increment views
    await Pet.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    const enrichedPet = addPetFields(pet);
    console.log('🐾 Pet found:', enrichedPet.displayName);
    
    res.json({
      success: true,
      data: enrichedPet
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/:id - Product ID:', req.params.id);
    
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Increment views
    await Product.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    const enrichedProduct = addProductFields(product);
    console.log('🛒 Product found:', enrichedProduct.displayName);
    
    res.json({
      success: true,
      data: enrichedProduct
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });
  }
});

// ===== CONTACT FORM ENDPOINT =====
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    console.log('📞 Contact form submission:', { name, email, subject: subject || 'General Inquiry' });
    
    // Save to database if Contact model exists
    try {
      const contact = new Contact({
        name,
        email,
        subject: subject || 'General Inquiry',
        message,
        status: 'new',
        submittedAt: new Date()
      });
      
      await contact.save();
      console.log('📞 Contact saved to database');
    } catch (dbError) {
      console.warn('Contact database save failed:', dbError.message);
    }
    
    res.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: {
        name,
        email,
        subject: subject || 'General Inquiry',
        submittedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process contact form',
      error: error.message
    });
  }
});

// ===== STATIC FILES & FRONTEND HANDLING =====
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/build');
  
  if (fs.existsSync(clientBuildPath)) {
    console.log('📁 Client build directory found - serving static files');
    
    // Serve static files with proper headers
    app.use(express.static(clientBuildPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      }
    });
  } else {
    console.log('📁 No client build directory - backend-only deployment');
    
    // Root endpoint for backend-only deployment
    app.get('/', (req, res) => {
      res.json({
        success: true,
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
            'GET /api/health',
            'GET /api/pets/featured',
            'GET /api/products/featured',
            'POST /api/contact',
            'GET /api/images/gcs/{path}',
            'GET /api/images/preset/{preset}/gcs/{path}'
          ],
          timestamp: new Date().toISOString()
        });
      }
    });
  }
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

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ Process terminated');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// ===== SERVER STARTUP =====
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Database: Connected`);
      console.log(`🖼️  Image Optimization: ${sharpAvailable ? 'Enabled' : 'Disabled'}`);
      console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Frontend: http://localhost:3000`);
        console.log(`🖼️  Image Test: http://localhost:${PORT}/api/images/health`);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Keep reference to server for graceful shutdown
    global.server = server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;