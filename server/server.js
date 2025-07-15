// server/server.js - PROPER VERSION WITH ROUTE MOUNTING
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Database URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // In production, continue with mock data if DB fails
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuing with mock data...');
      return false;
    } else {
      process.exit(1);
    }
  }
};

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://furbabies-backend.onrender.com', 'https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FurBabies API Server is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ===== ROUTE MOUNTING WITH ERROR HANDLING =====
const mountRoute = (path, routePath, routeName) => {
  try {
    console.log(`🔍 Mounting ${routeName} route: ${path}`);
    
    // Check if route file exists
    const route = require(routePath);
    
    if (typeof route !== 'function') {
      throw new Error(`${routePath} does not export a valid Express router`);
    }
    
    app.use(path, route);
    console.log(`✅ ${routeName} route mounted successfully: ${path}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to mount ${routeName} route:`, error.message);
    
    // Create fallback route that returns error info
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        message: `${routeName} route unavailable`,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    return false;
  }
};

// ===== INITIALIZE SERVER =====
const initializeServer = async () => {
  // Connect to database
  const dbConnected = await connectDB();
  
  // Mount API routes
  console.log('🚀 Mounting API routes...');
  const routeResults = {
    users: mountRoute('/api/users', './routes/users', 'Users'),
    pets: mountRoute('/api/pets', './routes/pets', 'Pets'),
    products: mountRoute('/api/products', './routes/products', 'Products'),
    news: mountRoute('/api/news', './routes/news', 'News'),
    admin: mountRoute('/api/admin', './routes/admin', 'Admin'),
    contact: mountRoute('/api/contact', './routes/contact', 'Contact')
  };
  
  // Log mounting results
  console.log('📊 Route mounting summary:');
  Object.entries(routeResults).forEach(([route, success]) => {
    console.log(`   ${success ? '✅' : '❌'} /api/${route}: ${success ? 'SUCCESS' : 'FAILED'}`);
  });
  
  const successCount = Object.values(routeResults).filter(Boolean).length;
  const totalRoutes = Object.keys(routeResults).length;
  console.log(`🎯 Routes mounted: ${successCount}/${totalRoutes}`);
  
  // If no routes mounted and no database, fall back to emergency server
  if (successCount === 0 && !dbConnected) {
    console.log('🚨 Falling back to emergency mock endpoints...');
    setupEmergencyRoutes();
  }
  
  // Create debug route
  app.get('/api/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Route debugging information',
      database: {
        connected: mongoose.connection.readyState === 1,
        uri: process.env.MONGODB_URI ? 'Set' : 'Not Set'
      },
      routes: {
        mounted: Object.keys(routeResults).filter(key => routeResults[key]),
        failed: Object.keys(routeResults).filter(key => !routeResults[key]),
        results: routeResults
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });
  
  // Catch unmatched API routes
  app.use('/api/*', (req, res) => {
    const availableRoutes = Object.keys(routeResults)
      .filter(key => routeResults[key])
      .map(key => `/api/${key}`);
    
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      availableRoutes,
      timestamp: new Date().toISOString()
    });
  });
  
  // Serve React frontend in production
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
      console.warn('⚠️ Frontend build folder not found:', frontendPath);
      app.get('*', (req, res) => {
        res.json({
          message: 'FurBabies API Server',
          status: 'Frontend not built',
          api: '/api/health'
        });
      });
    }
  }
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 FurBabies Server Starting...');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`   API Health: /api/health`);
    console.log(`   Debug Info: /api/debug/routes`);
    console.log('✅ Server is running successfully!');
  });
};

// ===== EMERGENCY FALLBACK ROUTES =====
const setupEmergencyRoutes = () => {
  console.log('🆘 Setting up emergency mock routes...');
  
  // Mock pets
  app.get('/api/pets', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          _id: 'mock-pet-1',
          name: 'Emergency Pet',
          type: 'dog',
          breed: 'Mixed',
          age: '2 years',
          description: 'Mock pet data - database unavailable',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/pet/default-pet.png',
          status: 'available',
          featured: true
        }
      ],
      message: 'Emergency mock data - database unavailable'
    });
  });
  
  // Mock products
  app.get('/api/products', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          _id: 'mock-product-1',
          name: 'Emergency Product',
          price: 19.99,
          category: 'accessories',
          description: 'Mock product data - database unavailable',
          imageUrl: 'https://storage.googleapis.com/furbabies-petstore/product/default-product.png',
          featured: true
        }
      ],
      message: 'Emergency mock data - database unavailable'
    });
  });
  
  // Mock news
  app.get('/api/news/featured', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 'mock-news-1',
          title: 'Server Running in Emergency Mode',
          summary: 'Database connection unavailable, using mock data.',
          category: 'system',
          author: 'System',
          featured: true,
          publishedAt: new Date()
        }
      ],
      message: 'Emergency mock data - database unavailable'
    });
  });
  
  console.log('✅ Emergency routes set up');
};

// ===== ERROR HANDLING =====
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📦 Database connection closed');
    process.exit(0);
  });
});

// Initialize the server
initializeServer().catch(err => {
  console.error('💥 Failed to initialize server:', err);
  process.exit(1);
});