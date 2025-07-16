// server/server.js - FIXED FOR RENDER DEPLOYMENT
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== RENDER-SPECIFIC PORT CONFIGURATION =====
const PORT = process.env.PORT || 10000;
console.log(`🚀 Starting server on port ${PORT}`);

// ===== MONGODB CONNECTION =====
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.db.databaseName}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // For Render deployment, don't exit - let it restart
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// ===== MONGOOSE SCHEMAS =====
const petSchema = new mongoose.Schema({
  name: String,
  type: String,
  breed: String,
  age: String,
  size: String,
  gender: String,
  description: String,
  image: String,
  status: { type: String, default: 'available' },
  category: String,
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  brand: String,
  price: Number,
  inStock: { type: Boolean, default: true },
  description: String,
  image: String,
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Pet = mongoose.model('Pet', petSchema);
const Product = mongoose.model('Product', productSchema);

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'https://furbabies-frontend.onrender.com',
    'https://furbabies-backend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FurBabies server is running!',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ===== PETS ENDPOINTS =====
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets called with params:', req.query);
    console.log('🌐 Request origin:', req.get('Origin'));
    
    const query = { status: 'available' };
    
    // Add filters
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.breed && req.query.breed !== 'all') {
      query.breed = new RegExp(req.query.breed, 'i');
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex }
      ];
    }
    
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Sorting
    let sortOptions = { createdAt: -1 };
    if (req.query.sort === 'name') sortOptions = { name: 1 };
    if (req.query.sort === 'newest') sortOptions = { createdAt: -1 };
    if (req.query.sort === 'oldest') sortOptions = { createdAt: 1 };
    
    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();
      
    const total = await Pet.countDocuments(query);
    
    // Add computed fields
    const enrichedPets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available'
    }));
    
    console.log(`✅ Returning ${enrichedPets.length} pets out of ${total} total`);
    
    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + pets.length < total
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// Get single pet by ID
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
    
    const enrichedPet = {
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available'
    };
    
    res.json({
      success: true,
      data: enrichedPet
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// ===== PRODUCTS ENDPOINTS =====
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛒 GET /api/products called with params:', req.query);
    console.log('🌐 Request origin:', req.get('Origin'));
    
    const query = { inStock: true };
    
    // Add filters
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i');
    }
    
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Sorting
    let sortOptions = { createdAt: -1 };
    if (req.query.sort === 'name') sortOptions = { name: 1 };
    if (req.query.sort === 'price') sortOptions = { price: 1 };
    if (req.query.sort === 'price-desc') sortOptions = { price: -1 };
    
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();
      
    const total = await Product.countDocuments(query);
    
    // Add computed fields
    const enrichedProducts = products.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Product',
      isAvailable: product.inStock
    }));
    
    console.log(`✅ Returning ${enrichedProducts.length} products out of ${total} total`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + products.length < total
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get single product by ID
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
    
    const enrichedProduct = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Product',
      isAvailable: product.inStock
    };
    
    res.json({
      success: true,
      data: enrichedProduct
    });
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// ===== NEWS ENDPOINTS =====
app.get('/api/news/featured', (req, res) => {
  console.log('📰 GET /api/news/featured called with params:', req.query);
  console.log('🌐 Request origin:', req.get('Origin'));
  
  const mockNews = [
    {
      id: '1',
      title: 'New Pet Adoption Center Opens Downtown',
      summary: 'A state-of-the-art pet adoption facility has opened its doors.',
      category: 'adoption',
      author: 'FurBabies Team',
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-01'),
      views: 1250,
      likes: 89,
      image: 'pet/golden-retriever-pup.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/golden-retriever-pup.png'
    },
    {
      id: '2',
      title: 'Holiday Pet Safety Tips',
      summary: 'Keep your furry friends safe during the holiday season.',
      category: 'safety',
      author: 'Dr. Sarah Johnson',
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-15'),
      views: 980,
      likes: 67,
      image: 'pet/cat.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/cat.png'
    },
    {
      id: '3',
      title: 'Success Story: Max Finds His Forever Home',
      summary: 'Follow Max the Golden Retriever journey from shelter to family.',
      category: 'success-story',
      author: 'Maria Rodriguez',
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-10'),
      views: 1567,
      likes: 234,
      image: 'pet/dog-b.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/dog-b.png'
    }
  ];
  
  const limit = parseInt(req.query.limit) || 3;
  const news = mockNews.slice(0, limit);
  
  console.log(`✅ Returning ${news.length} news articles`);
  
  res.json({
    success: true,
    data: news,
    count: news.length,
    message: 'Featured news retrieved successfully'
  });
});

// ===== ERROR HANDLING =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/news/featured'
    ]
  });
});

// ===== SERVE REACT FRONTEND =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Forcing shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

// ===== START SERVER =====
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Then start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 FurBabies Backend Server Starting...');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   CORS: Enabled for frontend domains`);
      console.log(`   API Health: /api/health`);
      console.log('✅ Backend server is running successfully!');
      
      // Log allowed origins
      console.log('🌐 Allowed Origins:');
      console.log('   - https://furbabies-frontend.onrender.com');
      console.log('   - https://furbabies-backend.onrender.com');
      console.log('   - http://localhost:3000');
      console.log('   - http://localhost:3001');
      console.log('   - https://localhost:3000');
    });
    
    // Handle graceful shutdown
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
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();