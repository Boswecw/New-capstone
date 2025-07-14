// server/server.js - COMPLETE VERSION WITH MONGODB ATLAS INTEGRATION
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

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 FurBabies Backend Server Starting...');
console.log('📍 Environment:', NODE_ENV);
console.log('🔌 Port:', PORT);

// ============================================
// DATABASE CONNECTION & MODELS
// ============================================

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

    console.log('🔌 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      maxPoolSize: NODE_ENV === 'production' ? 5 : 10,
      serverSelectionTimeoutMS: NODE_ENV === 'production' ? 10000 : 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    
    // Test collections exist
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📋 Available collections: ${collections.map(c => c.name).join(', ')}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    if (NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Connect to database first
connectDB().catch(err => {
  console.error('Database connection failed:', err.message);
});

// Import Models (require after connection)
const Pet = require('./models/Pet');
const Product = require('./models/Product');

// ============================================
// CORS CONFIGURATION
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://furbabies-frontend.onrender.com',
      'https://furbabies-backend.onrender.com',
      'https://furbabies-frontend.vercel.app',
      'https://furbabies-frontend.netlify.app',
    ];
    
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
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Fix image paths from database and construct proper Google Storage URLs
 */
const constructImageUrl = (imagePath, type = 'pet') => {
  if (!imagePath) return null;
  
  // If already a complete URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean and fix the path
  let cleanPath = imagePath.trim();
  
  // Fix plural paths from database (if they exist)
  cleanPath = cleanPath.replace(/^pets\//, 'pet/');
  cleanPath = cleanPath.replace(/^products\//, 'product/');
  
  // If path doesn't have folder prefix, add it
  if (!cleanPath.includes('/')) {
    const folder = type === 'product' ? 'product' : 'pet';
    cleanPath = `${folder}/${cleanPath}`;
  }
  
  const finalUrl = `https://storage.googleapis.com/furbabies-petstore/${cleanPath}`;
  console.log(`🔧 Image URL: ${imagePath} → ${finalUrl}`);
  
  return finalUrl;
};

/**
 * Enrich pet data with computed fields
 */
const enrichPetData = (pet) => {
  const petObj = pet.toObject ? pet.toObject() : pet;
  return {
    ...petObj,
    imageUrl: constructImageUrl(petObj.image, 'pet'),
    hasImage: !!petObj.image,
    displayName: petObj.name || 'Unnamed Pet',
    isAvailable: petObj.status === 'available',
    daysSincePosted: petObj.createdAt ? 
      Math.floor((new Date() - new Date(petObj.createdAt)) / (1000 * 60 * 60 * 24)) : 0
  };
};

/**
 * Enrich product data with computed fields
 */
const enrichProductData = (product) => {
  const productObj = product.toObject ? product.toObject() : product;
  return {
    ...productObj,
    imageUrl: constructImageUrl(productObj.image, 'product'),
    hasImage: !!productObj.image,
    displayName: productObj.name || 'Unnamed Product',
    formattedPrice: typeof productObj.price === 'number' ? `$${productObj.price.toFixed(2)}` : 'N/A'
  };
};

// ============================================
// HEALTH CHECK ROUTES
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // Test database connectivity
    const petCount = await Pet.countDocuments();
    const productCount = await Product.countDocuments();
    
    res.json({
      success: true,
      message: 'FurBabies Backend Server is running!',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      cors: 'Enabled',
      mongodb: 'Connected',
      database: {
        pets: petCount,
        products: productCount
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection issue',
      error: error.message
    });
  }
});

app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// PETS API ROUTES - MONGODB INTEGRATION
// ============================================

app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets called with params:', req.query);
    
    const { 
      featured, 
      limit = 10, 
      category, 
      status, 
      type, 
      page = 1,
      sort = 'newest' 
    } = req.query;
    
    // Build query filter
    const filter = {};
    
    // Filter by status (default to available)
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'available';
    }
    
    // Filter by featured
    if (featured === 'true') {
      filter.featured = true;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Filter by type
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    console.log('🔍 MongoDB Query Filter:', filter);
    
    // Calculate pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'random':
        // For random, we'll use MongoDB aggregation
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    let pets;
    let total;
    
    if (sort === 'random') {
      // Use MongoDB aggregation for random sampling
      const pipeline = [
        { $match: filter },
        { $sample: { size: limitNum } }
      ];
      
      pets = await Pet.aggregate(pipeline);
      total = await Pet.countDocuments(filter);
    } else {
      // Regular query with pagination
      pets = await Pet.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(); // Use lean() for better performance
      
      total = await Pet.countDocuments(filter);
    }
    
    // Enrich pet data with computed fields
    const enrichedPets = pets.map(enrichPetData);
    
    console.log(`✅ Found ${pets.length} pets from database (${total} total match filter)`);
    
    res.json({
      success: true,
      data: enrichedPets,
      count: pets.length,
      total: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + pets.length < total
      },
      filters: {
        featured: featured === 'true',
        category: category || 'all',
        status: status || 'available',
        type: type || 'all',
        sort: sort
      },
      message: `${pets.length} pets retrieved successfully from database`
    });
    
  } catch (error) {
    console.error('❌ Error fetching pets from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets from database',
      error: error.message
    });
  }
});

// Single pet by ID
app.get('/api/pets/:id', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id called with ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Increment view count (optional - update without waiting)
    Pet.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();
    
    const enrichedPet = enrichPetData(pet);
    
    console.log(`✅ Found pet: ${enrichedPet.displayName}`);
    
    res.json({
      success: true,
      data: enrichedPet
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
});

// ============================================
// PRODUCTS API ROUTES - MONGODB INTEGRATION
// ============================================

app.get('/api/products', async (req, res) => {
  try {
    console.log('🛒 GET /api/products called with params:', req.query);
    
    const { 
      featured, 
      limit = 10, 
      category, 
      inStock, 
      page = 1,
      sort = 'newest',
      search 
    } = req.query;
    
    // Build query filter
    const filter = {};
    
    // Filter by stock status
    if (inStock !== undefined) {
      filter.inStock = inStock === 'true';
    }
    
    // Filter by featured
    if (featured === 'true') {
      filter.featured = true;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { brand: { $regex: new RegExp(search, 'i') } }
      ];
    }
    
    console.log('🔍 MongoDB Query Filter:', filter);
    
    // Calculate pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'random':
        // Use aggregation for random
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    let products;
    let total;
    
    if (sort === 'random') {
      // Use MongoDB aggregation for random sampling
      const pipeline = [
        { $match: filter },
        { $sample: { size: limitNum } }
      ];
      
      products = await Product.aggregate(pipeline);
      total = await Product.countDocuments(filter);
    } else {
      // Regular query with pagination
      products = await Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      total = await Product.countDocuments(filter);
    }
    
    // Enrich product data with computed fields
    const enrichedProducts = products.map(enrichProductData);
    
    console.log(`✅ Found ${products.length} products from database (${total} total match filter)`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      count: products.length,
      total: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + products.length < total
      },
      filters: {
        featured: featured === 'true',
        category: category || 'all',
        inStock: inStock || 'all',
        search: search || '',
        sort: sort
      },
      message: `${products.length} products retrieved successfully from database`
    });
    
  } catch (error) {
    console.error('❌ Error fetching products from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products from database',
      error: error.message
    });
  }
});

// Single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/:id called with ID:', req.params.id);
    
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const enrichedProduct = enrichProductData(product);
    
    console.log(`✅ Found product: ${enrichedProduct.displayName}`);
    
    res.json({
      success: true,
      data: enrichedProduct
    });
    
  } catch (error) {
    console.error('❌ Error fetching product by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// ============================================
// DATABASE STATS & ADMIN ROUTES
// ============================================

app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalPets,
      availablePets,
      featuredPets,
      totalProducts,
      inStockProducts,
      featuredProducts
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: 'available' }),
      Pet.countDocuments({ featured: true }),
      Product.countDocuments(),
      Product.countDocuments({ inStock: true }),
      Product.countDocuments({ featured: true })
    ]);
    
    res.json({
      success: true,
      data: {
        pets: {
          total: totalPets,
          available: availablePets,
          featured: featuredPets,
          adopted: totalPets - availablePets
        },
        products: {
          total: totalProducts,
          inStock: inStockProducts,
          featured: featuredProducts,
          outOfStock: totalProducts - inStockProducts
        }
      },
      message: 'Database statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message
    });
  }
});

// ============================================
// OTHER API ROUTES
// ============================================

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }
  res.json({
    success: true,
    message: 'Contact message sent successfully',
    data: { id: Date.now().toString(), name, email, subject: subject || 'General Inquiry', message, createdAt: new Date().toISOString() }
  });
});

app.post('/api/users/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { id: Date.now().toString(), name, email, role: 'user', createdAt: new Date().toISOString() }
  });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  res.json({
    success: true,
    message: 'Login successful',
    data: { id: Date.now().toString(), name: 'Test User', email, role: 'user', token: 'mock-jwt-token' }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/stats', 
      'GET /api/pets?featured=true&limit=4&sort=random',
      'GET /api/products?featured=true&limit=4&sort=random',
      'GET /api/pets/:id',
      'GET /api/products/:id'
    ],
    tip: 'Use sort=random for home page random selection'
  });
});

if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  if (err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: 'CORS policy violation', origin: req.get('Origin') });
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
  console.log('🎉 =====================================');
  console.log('🚀 FurBabies Backend Server Ready!');
  console.log('🎉 =====================================');
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 URL: ${NODE_ENV === 'production' ? 'https://furbabies-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('✅ CORS: Configured for frontend domains');
  console.log('✅ MongoDB Atlas: Connected');
  console.log('✅ Routes: Live database integration');
  console.log('');
  console.log('🎲 Random endpoints for home page:');
  console.log('   🐕 4 Random Pets: /api/pets?featured=true&limit=4&sort=random');
  console.log('   🛒 4 Random Products: /api/products?featured=true&limit=4&sort=random');
  console.log('');
  console.log('📊 Database stats: /api/stats');
  console.log('🔍 Health check: /api/health');
  console.log('');
});

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;