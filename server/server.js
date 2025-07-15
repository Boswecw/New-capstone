// server/server.js - EMERGENCY STABLE VERSION
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 EMERGENCY SERVER STARTING...');

// ===== SUPER AGGRESSIVE CORS =====
app.use(cors({
  origin: true, // Allow ALL origins temporarily 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// Handle preflight for ALL routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.sendStatus(200);
});

app.use(express.json());

// Add CORS headers to ALL responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Emergency server running',
    timestamp: new Date().toISOString()
  });
});

// ===== IMAGE PROXY - SIMPLIFIED =====
app.get('/api/images/*', (req, res) => {
  const imagePath = req.params[0];
  const gcsUrl = `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
  
  console.log(`🖼️ Image proxy redirect: ${imagePath} -> ${gcsUrl}`);
  
  // Simple redirect instead of fetch to avoid crashes
  res.redirect(302, gcsUrl);
});

// ===== PETS ENDPOINT =====
app.get('/api/pets', (req, res) => {
  console.log('🐕 GET /api/pets called');
  
  const mockPets = [
    {
      _id: 'pet001',
      name: 'Pet 25',
      type: 'small-pet',
      breed: 'Hedgehog',
      age: '1 year',
      gender: 'male',
      description: 'A friendly hedgehog.',
      image: 'pet/hedge-hog-A.jpg',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/hedge-hog-A.jpg',
      status: 'available',
      featured: true
    },
    {
      _id: 'pet002',
      name: 'Koda',
      type: 'cat',
      breed: 'Kitten',
      age: '6 months',
      gender: 'female',
      description: 'A playful kitten.',
      image: 'pet/kitten.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/kitten.png',
      status: 'available',
      featured: true
    }
  ];
  
  // Apply filters
  let filtered = mockPets;
  if (req.query.featured === 'true') {
    filtered = filtered.filter(p => p.featured);
  }
  
  const limit = parseInt(req.query.limit) || filtered.length;
  const result = filtered.slice(0, limit);
  
  res.json({
    success: true,
    data: result,
    message: `Found ${result.length} pets`
  });
});

// ===== PRODUCTS ENDPOINT =====
app.get('/api/products', (req, res) => {
  console.log('🛍️ GET /api/products called');
  
  const mockProducts = [
    {
      _id: 'prod001',
      name: 'Covered Litter Box',
      category: 'Cat Care',
      price: 49.99,
      description: 'High-quality litter box.',
      image: 'product/covered-litter-box.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/covered-litter-box.png',
      inStock: true
    },
    {
      _id: 'prod002',
      name: 'Premium Dog Food',
      category: 'Dog Care',
      price: 89.99,
      description: 'Nutritious dog food.',
      image: 'product/premum-dog-food.png',
      imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/premum-dog-food.png',
      inStock: true
    }
  ];
  
  let filtered = mockProducts;
  if (req.query.inStock === 'true') {
    filtered = filtered.filter(p => p.inStock);
  }
  
  const limit = parseInt(req.query.limit) || filtered.length;
  const result = filtered.slice(0, limit);
  
  res.json({
    success: true,
    data: result,
    message: `Found ${result.length} products`
  });
});

// ===== CATCH ALL API =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.originalUrl}`
  });
});

// ===== FRONTEND SERVING =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ EMERGENCY SERVER RUNNING ON PORT ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Pets: http://localhost:${PORT}/api/pets`);
  console.log(`   Products: http://localhost:${PORT}/api/products`);
});

// ===== ERROR HANDLING =====
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  // Don't exit in emergency mode
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.message);
  // Don't exit in emergency mode
});
