// server/server.js - CORS FIXED VERSION
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== CORS CONFIGURATION - CRITICAL FIX =====
const corsOptions = {
  origin: [
    'https://furbabies-frontend.onrender.com',  // Your frontend domain
    'https://furbabies-backend.onrender.com',   // Your backend domain  
    'http://localhost:3000',                    // Local development
    'http://localhost:3001',                    // Alternative local
    'https://localhost:3000',                   // HTTPS local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours
};

// Apply CORS with options
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging with more detail
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.get('Origin'));
  console.log('User-Agent:', req.get('User-Agent'));
  next();
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FurBabies API Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    version: '1.1.0'
  });
});

// ===== MOCK ENDPOINTS WITH ENHANCED ERROR HANDLING =====

// Mock pets endpoint
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets called with params:', req.query);
    console.log('🌐 Request origin:', req.get('Origin'));
    
    // Add CORS headers explicitly (belt and suspenders approach)
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Simulate brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockPets = [
      {
        _id: 'pet001',
        name: 'Fluffy',
        type: 'cat',
        breed: 'Persian',
        age: '2 years',
        gender: 'Female',
        description: 'A lovely Persian cat looking for a loving home. Very gentle and good with children.',
        image: 'pet/cat.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/cat.png',
        status: 'available',
        featured: true,
        views: 120,
        likes: 45,
        createdAt: new Date('2024-12-01').toISOString()
      },
      {
        _id: 'pet002',
        name: 'Max',
        type: 'dog', 
        breed: 'Golden Retriever',
        age: '3 years',
        gender: 'Male',
        description: 'A friendly Golden Retriever who loves playing fetch and swimming. Great family dog.',
        image: 'pet/dog-b.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/dog-b.png',
        status: 'available',
        featured: true,
        views: 189,
        likes: 78,
        createdAt: new Date('2024-12-05').toISOString()
      },
      {
        _id: 'pet003',
        name: 'Bella',
        type: 'cat',
        breed: 'Siamese',
        age: '1 year',
        gender: 'Female',
        description: 'A playful Siamese kitten full of energy. She loves toys and climbing.',
        image: 'pet/kitten.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/kitten.png',
        status: 'available',
        featured: true,
        views: 156,
        likes: 92,
        createdAt: new Date('2024-12-10').toISOString()
      },
      {
        _id: 'pet004',
        name: 'Charlie',
        type: 'dog',
        breed: 'Labrador',
        age: '4 years',
        gender: 'Male',
        description: 'A loyal Labrador companion perfect for active families. Well-trained and social.',
        image: 'pet/dog-a.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/dog-a.png',
        status: 'available',
        featured: true,
        views: 203,
        likes: 134,
        createdAt: new Date('2024-12-08').toISOString()
      }
    ];

    // Handle query parameters
    let filteredPets = [...mockPets];
    
    if (req.query.featured === 'true') {
      filteredPets = filteredPets.filter(pet => pet.featured);
    }
    
    if (req.query.status) {
      filteredPets = filteredPets.filter(pet => pet.status === req.query.status);
    }
    
    if (req.query.type) {
      filteredPets = filteredPets.filter(pet => pet.type === req.query.type);
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      filteredPets = filteredPets.slice(0, limit);
    }
    
    console.log(`✅ Returning ${filteredPets.length} pets out of ${mockPets.length} total`);
    
    res.json({
      success: true,
      data: filteredPets,
      count: filteredPets.length,
      total: mockPets.length,
      message: 'Pets retrieved successfully (mock data)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in pets endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mock products endpoint
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛒 GET /api/products called with params:', req.query);
    console.log('🌐 Request origin:', req.get('Origin'));
    
    // Add CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Simulate brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockProducts = [
      {
        _id: 'prod001',
        name: 'Premium Dog Food',
        category: 'food',
        brand: 'PetNutrition Pro',
        price: 29.99,
        description: 'High-quality nutrition for dogs of all ages with real chicken and vegetables.',
        image: 'product/dog-food.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/dog-food.png',
        featured: true,
        inStock: true,
        stockCount: 45,
        rating: 4.8,
        reviews: 128,
        createdAt: new Date('2024-12-01').toISOString()
      },
      {
        _id: 'prod002',
        name: 'Cat Scratching Post',
        category: 'toys',
        brand: 'FelinePlay',
        price: 45.99,
        description: 'Durable sisal scratching post to keep cats entertained and claws healthy.',
        image: 'product/cat-toy.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/cat-toy.png',
        featured: true,
        inStock: true,
        stockCount: 23,
        rating: 4.6,
        reviews: 89,
        createdAt: new Date('2024-12-03').toISOString()
      },
      {
        _id: 'prod003',
        name: 'Pet Travel Carrier',
        category: 'accessories',
        brand: 'SafeTravel',
        price: 79.99,
        description: 'Comfortable and secure carrier for pet travel with airline approval.',
        image: 'product/carrier.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/carrier.png',
        featured: true,
        inStock: true,
        stockCount: 12,
        rating: 4.9,
        reviews: 156,
        createdAt: new Date('2024-12-05').toISOString()
      },
      {
        _id: 'prod004',
        name: 'Premium Dog Leash Set',
        category: 'accessories',
        brand: 'WalkSafe Pro',
        price: 24.99,
        description: 'Durable nylon leash and matching collar set for daily walks and training.',
        image: 'product/leash.png',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/leash.png',
        featured: true,
        inStock: true,
        stockCount: 67,
        rating: 4.7,
        reviews: 203,
        createdAt: new Date('2024-12-07').toISOString()
      }
    ];

    // Handle query parameters
    let filteredProducts = [...mockProducts];
    
    if (req.query.featured === 'true') {
      filteredProducts = filteredProducts.filter(product => product.featured);
    }
    
    if (req.query.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === req.query.category.toLowerCase());
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      filteredProducts = filteredProducts.slice(0, limit);
    }
    
    console.log(`✅ Returning ${filteredProducts.length} products out of ${mockProducts.length} total`);
    
    res.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length,
      total: mockProducts.length,
      message: 'Products retrieved successfully (mock data)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in products endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mock news endpoint
app.get('/api/news/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured called with params:', req.query);
    console.log('🌐 Request origin:', req.get('Origin'));
    
    // Add CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const mockNews = [
      {
        id: 'news001',
        title: 'New Pet Adoption Center Opens Downtown',
        summary: 'A state-of-the-art facility opens downtown, providing better care for pets awaiting adoption.',
        content: 'The new FurBabies adoption center features modern facilities, play areas, and medical care.',
        category: 'adoption',
        author: 'FurBabies Team',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-01'),
        views: 1250,
        likes: 89,
        image: 'news/adoption-center.jpg',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/adoption-center.jpg'
      },
      {
        id: 'news002',
        title: 'Holiday Pet Safety Tips',
        summary: 'Keep your pets safe during the holidays with these essential safety tips and guidelines.',
        content: 'Learn about holiday foods to avoid, decoration safety, and travel tips for pets.',
        category: 'safety', 
        author: 'Dr. Sarah Johnson',
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-15'),
        views: 980,
        likes: 67,
        image: 'news/holiday-safety.jpg',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/holiday-safety.jpg'
      },
      {
        id: 'news003',
        title: 'Success Story: Max Finds His Forever Home',
        summary: 'Follow Max the Golden Retriever\'s heartwarming journey from shelter to his loving forever family.',
        content: 'After months of waiting, Max finally found his perfect match with the Johnson family.',
        category: 'success-story',
        author: 'Maria Rodriguez', 
        featured: true,
        published: true,
        publishedAt: new Date('2024-12-10'),
        views: 1567,
        likes: 234,
        image: 'news/max-success.jpg',
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/max-success.jpg'
      }
    ];
    
    const limit = parseInt(req.query.limit) || 3;
    const news = mockNews.slice(0, limit);
    
    console.log(`✅ Returning ${news.length} news articles`);
    
    res.json({
      success: true,
      data: news,
      count: news.length,
      message: 'Featured news retrieved successfully (mock data)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in news endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Individual pet endpoint
app.get('/api/pets/:id', async (req, res) => {
  try {
    console.log(`🐕 GET /api/pets/${req.params.id}`);
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const mockPet = {
      _id: req.params.id,
      name: 'Sample Pet',
      type: 'dog',
      breed: 'Mixed Breed',
      age: '2 years',
      gender: 'Unknown',
      description: 'A wonderful pet looking for a loving home.',
      image: 'pet/default-pet.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/default-pet.png',
      status: 'available',
      featured: false,
      views: 45,
      likes: 12,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockPet,
      message: 'Pet retrieved successfully (mock data)'
    });
  } catch (error) {
    console.error('❌ Error in pet detail endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message
    });
  }
});

// Catch unmatched API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ API endpoint not found: ${req.method} ${req.originalUrl}`);
  
  // Add CORS headers even for 404s
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id', 
      'GET /api/products',
      'GET /api/news/featured'
    ],
    timestamp: new Date().toISOString()
  });
});

// Serve React frontend in production (if applicable)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  
  // Check if build folder exists
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    console.log('🎨 Serving React frontend from:', frontendPath);
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.log('ℹ️ Frontend build folder not found - API only mode');
    app.get('*', (req, res) => {
      res.json({
        message: 'FurBabies API Server',
        status: 'API Only',
        health: '/api/health',
        frontend: 'Deployed separately'
      });
    });
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 FurBabies Backend Server Starting...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   CORS: Enabled for frontend domains`);
  console.log(`   API Health: /api/health`);
  console.log('✅ Backend server is running successfully!');
  console.log('🌐 Allowed Origins:');
  corsOptions.origin.forEach(origin => console.log(`   - ${origin}`));
});

// Enhanced error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.name, err.message);
  console.error('Stack:', err.stack);
  // Don't exit in production - log and continue
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.name, err.message);
  console.error('Stack:', err.stack);
  // Don't exit in production - log and continue
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});