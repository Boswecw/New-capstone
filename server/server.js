// server/server.js - Updated with Image Proxy Support
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://furbabies-frontend.onrender.com', 'https://furbabies-petstore.onrender.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ===============================================
// IMAGE PROXY ROUTE - CRITICAL FOR CORS WORKAROUND
// ===============================================
app.get('/api/images/*', async (req, res) => {
  try {
    const imagePath = req.params[0]; // Gets everything after /api/images/
    const gcsUrl = `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
    
    console.log(`🖼️ Proxying image: ${imagePath} -> ${gcsUrl}`);
    
    // Try to use node-fetch if available, otherwise use native fetch (Node 18+)
    let fetch;
    try {
      fetch = require('node-fetch');
    } catch (err) {
      // Use native fetch if node-fetch is not installed (Node 18+)
      fetch = globalThis.fetch;
      if (!fetch) {
        console.error('❌ No fetch implementation available. Install node-fetch: npm install node-fetch');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error: fetch not available'
        });
      }
    }
    
    // Fetch image from Google Cloud Storage
    const response = await fetch(gcsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FurBabies-Backend-Proxy/1.0'
      }
    });
    
    if (!response.ok) {
      console.warn(`❌ Image not found: ${gcsUrl} (Status: ${response.status})`);
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        path: imagePath,
        status: response.status
      });
    }
    
    // Get content type from response or infer from file extension
    const contentType = response.headers.get('content-type') || getContentTypeFromPath(imagePath);
    
    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Proxy-Cache': 'MISS',
      'X-Image-Source': 'gcs-proxy'
    });
    
    // Handle HEAD requests
    if (req.method === 'HEAD') {
      return res.end();
    }
    
    // Stream the image data
    const buffer = await response.buffer();
    res.send(buffer);
    
    console.log(`✅ Image proxied successfully: ${imagePath} (${buffer.length} bytes)`);
    
  } catch (error) {
    console.error(`❌ Image proxy error for ${req.params[0]}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Image proxy error',
      error: error.message,
      path: req.params[0]
    });
  }
});

// Handle OPTIONS requests for image proxy
app.options('/api/images/*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  });
  res.status(200).end();
});

// Helper function to determine content type from file extension
function getContentTypeFromPath(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon'
  };
  return contentTypes[ext] || 'image/jpeg';
}

// ===============================================
// HEALTH CHECK
// ===============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FurBabies Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      imageProxy: true,
      cors: true,
      mockData: true
    }
  });
});

// ===============================================
// MOCK PETS ENDPOINT
// ===============================================
app.get('/api/pets', (req, res) => {
  console.log('🐕 GET /api/pets called with query:', req.query);
  
  const mockPets = [
    {
      _id: 'pet001',
      name: 'Pet 25',
      type: 'small-pet',
      breed: 'Hedgehog',
      age: '1 year',
      gender: 'male',
      description: 'A friendly hedgehog looking for a caring home.',
      image: 'pet/hedge-hog-A.jpg',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/hedge-hog-A.jpg',
      status: 'available',
      featured: true,
      createdAt: new Date('2024-12-01').toISOString()
    },
    {
      _id: 'pet002',
      name: 'Koda',
      type: 'cat',
      breed: 'Kitten',
      age: '6 months',
      gender: 'female',
      description: 'A playful kitten ready for adoption.',
      image: 'pet/kitten.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/kitten.png',
      status: 'available',
      featured: true,
      createdAt: new Date('2024-12-05').toISOString()
    },
    {
      _id: 'pet003',
      name: 'Maggie',
      type: 'dog',
      breed: 'Labrador Puppy',
      age: '8 weeks',
      gender: 'female',
      description: 'An adorable lab puppy looking for her forever family.',
      image: 'pet/lab-puppy-B.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/lab-puppy-B.png',
      status: 'available',
      featured: true,
      createdAt: new Date('2024-12-10').toISOString()
    },
    {
      _id: 'pet004',
      name: 'Pet 1',
      type: 'aquatic',
      breed: 'Beta Fish',
      age: '6 months',
      gender: 'unknown',
      description: 'A beautiful beta fish for aquarium enthusiasts.',
      image: 'pet/betas-fish.jpg',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/betas-fish.jpg',
      status: 'available',
      featured: true,
      createdAt: new Date('2024-12-08').toISOString()
    },
    {
      _id: 'pet005',
      name: 'Max',
      type: 'dog',
      breed: 'Golden Retriever',
      age: '3 years',
      gender: 'male',
      description: 'A friendly and loyal companion.',
      image: 'pet/golden-retriever.jpg',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/golden-retriever.jpg',
      status: 'available',
      featured: false,
      createdAt: new Date('2024-11-28').toISOString()
    },
    {
      _id: 'pet006',
      name: 'Bella',
      type: 'cat',
      breed: 'Siamese',
      age: '2 years',
      gender: 'female',
      description: 'A graceful and intelligent cat.',
      image: 'pet/siamese-cat.jpg',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/siamese-cat.jpg',
      status: 'available',
      featured: false,
      createdAt: new Date('2024-11-30').toISOString()
    }
  ];
  
  // Handle query parameters
  let filteredPets = [...mockPets];
  
  // Filter by featured status
  if (req.query.featured === 'true') {
    filteredPets = filteredPets.filter(pet => pet.featured);
  }
  
  // Filter by status
  if (req.query.status) {
    filteredPets = filteredPets.filter(pet => pet.status === req.query.status);
  }
  
  // Filter by type/category
  if (req.query.category) {
    filteredPets = filteredPets.filter(pet => pet.type === req.query.category);
  }
  
  // Apply limit
  const limit = parseInt(req.query.limit) || filteredPets.length;
  const paginatedPets = filteredPets.slice(0, limit);
  
  // Wrap in data structure expected by frontend
  const response = {
    success: true,
    data: {
      data: paginatedPets,
      totalCount: filteredPets.length,
      currentPage: 1,
      totalPages: Math.ceil(filteredPets.length / limit)
    },
    message: `Found ${paginatedPets.length} pets matching your criteria`,
    pagination: {
      total: filteredPets.length,
      limit: limit,
      page: 1,
      pages: Math.ceil(filteredPets.length / limit)
    }
  };
  
  console.log(`✅ Returning ${paginatedPets.length} pets (filtered from ${mockPets.length})`);
  res.json(response);
});

// Get single pet by ID
app.get('/api/pets/:id', (req, res) => {
  console.log(`🐕 GET /api/pets/${req.params.id} called`);
  
  // Simple mock pet response
  const mockPet = {
    _id: req.params.id,
    name: 'Sample Pet',
    type: 'dog',
    breed: 'Mixed Breed',
    age: '2 years',
    gender: 'unknown',
    description: 'A wonderful pet looking for a loving home.',
    image: 'pet/default-pet.png',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/default-pet.png',
    status: 'available',
    featured: false,
    views: 0,
    createdAt: new Date().toISOString(),
    location: 'Pet Adoption Center',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'medium',
    size: 'medium'
  };
  
  res.json({
    success: true,
    data: mockPet
  });
});

// ===============================================
// MOCK PRODUCTS ENDPOINT
// ===============================================
app.get('/api/products', (req, res) => {
  console.log('🛍️ GET /api/products called with query:', req.query);
  
  const mockProducts = [
    {
      _id: 'prod001',
      name: 'Covered Litter Box',
      category: 'Cat Care',
      price: 49.99,
      description: 'A high-quality covered litter box for privacy and odor control.',
      image: 'product/covered-litter-box.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/covered-litter-box.png',
      inStock: true,
      featured: true,
      rating: 4.5,
      reviews: 128
    },
    {
      _id: 'prod002',
      name: 'Premium Dog Food',
      category: 'Dog Care',
      price: 89.99,
      description: 'Nutritious premium dog food for healthy and happy pets.',
      image: 'product/premum-dog-food.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/premum-dog-food.png',
      inStock: true,
      featured: true,
      rating: 4.8,
      reviews: 256
    },
    {
      _id: 'prod003',
      name: 'Interactive Dog Toy',
      category: 'Toys',
      price: 24.99,
      description: 'Keep your dog entertained with this interactive puzzle toy.',
      image: 'product/dog-toy.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/dog-toy.png',
      inStock: true,
      featured: false,
      rating: 4.3,
      reviews: 89
    },
    {
      _id: 'prod004',
      name: 'Cat Scratching Post',
      category: 'Cat Care',
      price: 79.99,
      description: 'Durable scratching post to keep your cat happy and furniture safe.',
      image: 'product/cat-scratching-post.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/cat-scratching-post.png',
      inStock: false,
      featured: false,
      rating: 4.6,
      reviews: 167
    }
  ];
  
  // Handle query parameters
  let filteredProducts = [...mockProducts];
  
  // Filter by inStock
  if (req.query.inStock === 'true') {
    filteredProducts = filteredProducts.filter(product => product.inStock);
  }
  
  // Filter by featured
  if (req.query.featured === 'true') {
    filteredProducts = filteredProducts.filter(product => product.featured);
  }
  
  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category.toLowerCase().includes(req.query.category.toLowerCase())
    );
  }
  
  // Apply limit
  const limit = parseInt(req.query.limit) || filteredProducts.length;
  const paginatedProducts = filteredProducts.slice(0, limit);
  
  const response = {
    success: true,
    data: paginatedProducts,
    pagination: {
      total: filteredProducts.length,
      limit: limit,
      page: 1,
      pages: Math.ceil(filteredProducts.length / limit)
    },
    filters: {
      inStock: req.query.inStock,
      featured: req.query.featured,
      category: req.query.category
    },
    message: `Found ${paginatedProducts.length} products matching your criteria`
  };
  
  console.log(`✅ Returning ${paginatedProducts.length} products (filtered from ${mockProducts.length})`);
  res.json(response);
});

// ===============================================
// MOCK NEWS ENDPOINT
// ===============================================
app.get('/api/news/featured', (req, res) => {
  console.log('📰 GET /api/news/featured called');
  
  const mockNews = [
    {
      id: 'news001',
      title: 'New Pet Adoption Center Opens Downtown',
      summary: 'A state-of-the-art facility opens to help more pets find homes.',
      category: 'adoption',
      author: 'FurBabies Team',
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-01'),
      views: 1250,
      image: 'news/adoption-center.jpg'
    },
    {
      id: 'news002',
      title: 'Holiday Pet Safety Tips',
      summary: 'Important tips to keep your pets safe during the holiday season.',
      category: 'safety', 
      author: 'Dr. Sarah Johnson',
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-15'),
      views: 980,
      image: 'news/holiday-safety.jpg'
    },
    {
      id: 'news003',
      title: 'Success Story: Max Finds His Forever Home',
      summary: 'Follow Max\'s heartwarming journey to finding his perfect family.',
      category: 'success-story',
      author: 'Maria Rodriguez', 
      featured: true,
      published: true,
      publishedAt: new Date('2024-12-10'),
      views: 1567,
      image: 'news/max-success.jpg'
    }
  ];
  
  const limit = parseInt(req.query.limit) || 3;
  const news = mockNews.slice(0, limit);
  
  res.json({
    success: true,
    data: news,
    count: news.length,
    message: 'Featured news retrieved successfully'
  });
});

// ===============================================
// API DOCUMENTATION ROUTE
// ===============================================
app.get('/api', (req, res) => {
  res.json({
    message: 'FurBabies Pet Store API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      pets: {
        list: 'GET /api/pets',
        single: 'GET /api/pets/:id',
        parameters: 'featured, status, category, limit'
      },
      products: {
        list: 'GET /api/products',
        parameters: 'inStock, featured, category, limit'
      },
      news: {
        featured: 'GET /api/news/featured'
      },
      images: {
        proxy: 'GET /api/images/*',
        description: 'Proxies images from Google Cloud Storage'
      }
    },
    documentation: 'https://docs.furbabies.com/api'
  });
});

// ===============================================
// ERROR HANDLERS
// ===============================================

// Catch all API routes that don't exist
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id', 
      'GET /api/products',
      'GET /api/news/featured',
      'GET /api/images/*'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// SERVE REACT FRONTEND IN PRODUCTION
// ===============================================
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  
  // Serve static files
  app.use(express.static(frontendPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-cache');
      }
    }
  }));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===============================================
// START SERVER
// ===============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 FurBabies Backend Server Starting...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('');
  console.log('📡 Available Endpoints:');
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Pets API: http://localhost:${PORT}/api/pets`);
  console.log(`   Products API: http://localhost:${PORT}/api/products`);
  console.log(`   News API: http://localhost:${PORT}/api/news/featured`);
  console.log(`   Image Proxy: http://localhost:${PORT}/api/images/*`);
  console.log('');
  console.log('✅ Server is running and ready to handle requests!');
});

// ===============================================
// GRACEFUL SHUTDOWN HANDLING
// ===============================================
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});