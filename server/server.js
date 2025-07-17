// server/server.js - CORRECTED VERSION for Backend-Only Deployment
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

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(compression());

// CORS configuration - Updated for multiple domains
const allowedOrigins = [
  'https://furbabies-petstore.onrender.com',
  'https://new-capstone.onrender.com',
  'https://furbabies-frontend.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Add regex for any Render subdomain
allowedOrigins.push(/https:\/\/.*\.onrender\.com$/);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// ===== DATABASE SCHEMAS =====
const petSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  breed: String,
  age: String,
  size: String,
  gender: String,
  description: String,
  image: String,
  status: { type: String, default: 'available' },
  category: String,
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { 
  _id: false,
  timestamps: true 
});

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  description: String,
  image: String,
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { 
  _id: false,
  timestamps: true 
});

// Create models
const Pet = mongoose.model('Pet', petSchema);
const Product = mongoose.model('Product', productSchema);

// ===== UTILITY FUNCTIONS =====
const addPetFields = (pet) => ({
  ...pet,
  displayName: pet.name || 'Unnamed Pet',
  ageDisplay: pet.age || 'Age unknown',
  imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
  fallbackImageUrl: '/api/images/fallback/pet'
});

const addProductFields = (product) => ({
  ...product,
  displayName: product.name || 'Product',
  priceDisplay: product.price ? `$${product.price.toFixed(2)}` : 'Price N/A',
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

// ===== FEATURED PETS ENDPOINT =====
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

// ===== FEATURED PRODUCTS ENDPOINT =====
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

// ===== FEATURED NEWS ENDPOINT =====
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

// ===== ALL PETS ENDPOINT =====
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    const query = { status: 'available' };

    // Apply filters
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
        { type: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { updatedAt: -1 };
    if (req.query.sort === 'name') sortOptions = { name: 1 };
    if (req.query.sort === 'type') sortOptions = { type: 1, name: 1 };

    const [pets, totalCount] = await Promise.all([
      Pet.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Pet.countDocuments(query)
    ]);

    const enrichedPets = pets.map(addPetFields);

    console.log(`🐕 Found ${enrichedPets.length} pets (${totalCount} total)`);
    
    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        type: req.query.type || 'all',
        category: req.query.category || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
});

// ===== ALL PRODUCTS ENDPOINT =====
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

    const query = { inStock: true };

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let sortOptions = { updatedAt: -1 };
    if (req.query.sort === 'name') sortOptions = { name: 1 };
    if (req.query.sort === 'price') sortOptions = { price: 1 };

    const [products, totalCount] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);

    const enrichedProducts = products.map(addProductFields);

    console.log(`🛒 Found ${enrichedProducts.length} products (${totalCount} total)`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        category: req.query.category || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// ===== SINGLE PET ENDPOINT =====
app.get('/api/pets/:id', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();

    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    await Pet.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    const enrichedPet = addPetFields(pet);

    console.log('🐕 Pet found:', enrichedPet.displayName);
    
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

// ===== SINGLE PRODUCT ENDPOINT =====
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

// ===== API ROUTES =====
app.use('/api/images', require('./routes/images'));
app.use('/api/gcs', require('./routes/gcs'));

// ===== STATIC FILES & FRONTEND (FIXED FOR BACKEND-ONLY) =====
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/build');
  
  if (fs.existsSync(clientBuildPath)) {
    console.log('📁 Client build directory found - serving static files');
    app.use(express.static(clientBuildPath));
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
            '/api/products/featured',
            '/api/news/featured'
          ],
          timestamp: new Date().toISOString()
        });
      }
    });
  }
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
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Test database connection
    const petCount = await Pet.countDocuments();
    const productCount = await Product.countDocuments();
    console.log(`📊 Database contains ${petCount} pets and ${productCount} products`);
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server running on port', PORT);
      console.log('📡 Environment:', process.env.NODE_ENV || 'development');
      console.log('🌐 CORS enabled for:', allowedOrigins);
      console.log('🖼️ Image proxy available at: /api/images/gcs/');
      console.log('✅ Server is running successfully!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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