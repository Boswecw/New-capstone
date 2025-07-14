// server/server.js - RENDER-OPTIMIZED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== RENDER-SPECIFIC OPTIMIZATIONS =====

// Enable compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression and speed
  threshold: 1024 // Only compress responses larger than 1KB
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Render
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://furbabies-petstore.onrender.com', 'https://furbabies-frontend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging with performance tracking
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')?.substring(0, 50) || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'production') {
      console.log('REQUEST:', JSON.stringify(logData));
    } else {
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

// ===== DATABASE CONNECTION WITH RENDER OPTIMIZATIONS =====
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Render-optimized connection options
      maxPoolSize: 5, // Limit connections for free tier
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      connectTimeoutMS: 10000, // 10 second connection timeout
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      retryWrites: true,
      retryReads: true,
    });

    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit on Render - let the service restart
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// ===== HEALTH CHECK ENDPOINT =====
app.get('/api/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  res.json({
    success: true,
    data: health,
    message: 'Health check passed'
  });
});

// Keep-alive endpoint to prevent cold starts
app.get('/api/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Pong!', 
    timestamp: new Date().toISOString() 
  });
});

// ===== MOCK DATA ENDPOINTS (FOR TESTING) =====
const mockPets = [
  {
    _id: '1',
    name: 'Max',
    breed: 'Golden Retriever',
    age: '2 years',
    size: 'Large',
    category: 'dog',
    description: 'Friendly and energetic dog looking for a loving home.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pets/golden-retriever.jpg',
    featured: true,
    available: true,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    _id: '2',
    name: 'Luna',
    breed: 'Persian Cat',
    age: '1 year',
    size: 'Medium',
    category: 'cat',
    description: 'Gentle and affectionate cat perfect for families.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pets/persian-cat.jpg',
    featured: true,
    available: true,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    _id: '3',
    name: 'Buddy',
    breed: 'Labrador Mix',
    age: '3 years',
    size: 'Large',
    category: 'dog',
    description: 'Loyal and well-trained companion.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pets/labrador-mix.jpg',
    featured: true,
    available: true,
    createdAt: new Date('2024-01-25').toISOString()
  }
];

const mockProducts = [
  {
    _id: '1',
    name: 'Premium Dog Food',
    category: 'food',
    brand: 'PetNutrition',
    price: 29.99,
    description: 'High-quality nutrition for adult dogs.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/products/dog-food.jpg',
    featured: true,
    inStock: true,
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    _id: '2',
    name: 'Cat Scratching Post',
    category: 'toys',
    brand: 'FelineJoy',
    price: 45.99,
    description: 'Durable scratching post for cats.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/products/scratching-post.jpg',
    featured: true,
    inStock: true,
    createdAt: new Date('2024-01-12').toISOString()
  },
  {
    _id: '3',
    name: 'Pet Carrier',
    category: 'accessories',
    brand: 'TravelPet',
    price: 89.99,
    description: 'Comfortable and secure pet carrier.',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/products/pet-carrier.jpg',
    featured: true,
    inStock: true,
    createdAt: new Date('2024-01-14').toISOString()
  }
];

// ===== API ROUTES =====

// Pets endpoints
app.get('/api/pets', (req, res) => {
  console.log('📋 GET /api/pets');
  const { category, featured, limit } = req.query;
  let pets = [...mockPets];
  
  if (category) {
    pets = pets.filter(pet => pet.category === category);
  }
  
  if (featured === 'true') {
    pets = pets.filter(pet => pet.featured);
  }
  
  if (limit) {
    pets = pets.slice(0, parseInt(limit));
  }
  
  res.json({
    success: true,
    data: pets,
    count: pets.length,
    message: 'Pets retrieved successfully'
  });
});

app.get('/api/pets/featured', (req, res) => {
  console.log('⭐ GET /api/pets/featured');
  const limit = parseInt(req.query.limit) || 6;
  const featuredPets = mockPets.filter(pet => pet.featured).slice(0, limit);
  
  res.json({
    success: true,
    data: featuredPets,
    count: featuredPets.length,
    message: 'Featured pets retrieved successfully'
  });
});

app.get('/api/pets/:id', (req, res) => {
  console.log(`🐕 GET /api/pets/${req.params.id}`);
  const pet = mockPets.find(p => p._id === req.params.id);
  
  if (!pet) {
    return res.status(404).json({
      success: false,
      message: 'Pet not found'
    });
  }
  
  res.json({
    success: true,
    data: pet,
    message: 'Pet retrieved successfully'
  });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  console.log('🛒 GET /api/products');
  const { category, brand, featured, limit } = req.query;
  let products = [...mockProducts];
  
  if (category) {
    products = products.filter(product => product.category === category);
  }
  
  if (brand) {
    products = products.filter(product => product.brand === brand);
  }
  
  if (featured === 'true') {
    products = products.filter(product => product.featured);
  }
  
  if (limit) {
    products = products.slice(0, parseInt(limit));
  }
  
  res.json({
    success: true,
    data: products,
    count: products.length,
    message: 'Products retrieved successfully'
  });
});

app.get('/api/products/featured', (req, res) => {
  console.log('⭐ GET /api/products/featured');
  const limit = parseInt(req.query.limit) || 6;
  const featuredProducts = mockProducts.filter(product => product.featured).slice(0, limit);
  
  res.json({
    success: true,
    data: featuredProducts,
    count: featuredProducts.length,
    message: 'Featured products retrieved successfully'
  });
});

app.get('/api/products/categories', (req, res) => {
  console.log('📂 GET /api/products/categories');
  const categories = [...new Set(mockProducts.map(product => product.category))];
  
  res.json({
    success: true,
    data: categories,
    count: categories.length,
    message: 'Categories retrieved successfully'
  });
});

app.get('/api/products/brands', (req, res) => {
  console.log('🏷️ GET /api/products/brands');
  const brands = [...new Set(mockProducts.map(product => product.brand))];
  
  res.json({
    success: true,
    data: brands,
    count: brands.length,
    message: 'Brands retrieved successfully'
  });
});

// ===== ERROR HANDLING =====
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/ping',
      'GET /api/pets',
      'GET /api/pets/featured',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/featured',
      'GET /api/products/categories',
      'GET /api/products/brands'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error.message);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ===== SERVE STATIC FILES IN PRODUCTION =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server Starting...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`   Health Check: /api/health`);
  console.log(`   Keep-Alive: /api/ping`);
  console.log('✅ Server is running!');
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

// ===== KEEP-ALIVE CRON JOB (OPTIONAL) =====
if (process.env.NODE_ENV === 'production') {
  // Self-ping every 14 minutes to prevent cold starts
  setInterval(() => {
    console.log('⏰ Keep-alive ping...');
    // You can implement a self-ping here if needed
  }, 14 * 60 * 1000); // 14 minutes
}

module.exports = app;