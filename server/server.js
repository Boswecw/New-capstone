// server/server.js - COMPLETE VERSION WITH COMPREHENSIVE DEBUGGING
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== ENVIRONMENT SETUP =====
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('🚀 Starting FurBabies Backend Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`⏰ Startup Time: ${new Date().toISOString()}`);

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Enhanced Morgan logging for debugging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS Configuration with debugging
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://furbabies-frontend.onrender.com',
    /\.onrender\.com$/,
    /localhost:\d+$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`🔍 Query:`, req.query);
    }
  }
  next();
});

// ===== DATABASE CONNECTION WITH ENHANCED DEBUGGING =====
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('🔍 Available env vars:', Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('mongo')));
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Extract database name from connection string
    let expectedDatabase = 'test';
    try {
      const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
      if (url.pathname && url.pathname !== '/') {
        expectedDatabase = url.pathname.substring(1);
      }
    } catch (e) {
      console.warn('⚠️ Could not parse database name from URI');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('🌐 Expected Database:', expectedDatabase);
    
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('🗃️ Connected Database:', conn.connection.db.databaseName);
    console.log('🚀 Ready State:', conn.connection.readyState);
    
    // Database diagnostic
    try {
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('📂 Available collections:', collections.map(c => c.name));
      
      // Count documents in potential collections
      const possibleCollections = ['pets', 'Pet', 'Pets', 'products', 'Product', 'Products'];
      for (const collName of possibleCollections) {
        try {
          const count = await conn.connection.db.collection(collName).countDocuments();
          if (count > 0) {
            console.log(`📊 Collection "${collName}": ${count} documents`);
          }
        } catch (e) {
          // Collection doesn't exist
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not perform collection diagnostic:', error.message);
    }

    return conn;
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    throw err;
  }
};

// ===== GOOGLE CLOUD STORAGE CORS WORKAROUND =====
const BUCKET_NAME = 'furbabies-petstore';

// Image proxy route to handle CORS
app.get('/api/images/*', async (req, res) => {
  try {
    const imagePath = req.params[0];
    const bucketUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${imagePath}`;
    
    console.log(`🖼️ Image proxy request: ${imagePath}`);
    console.log(`🔗 Redirecting to: ${bucketUrl}`);
    
    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.redirect(302, bucketUrl);
    
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    res.status(404).json({
      success: false,
      message: 'Image not found',
      error: error.message,
      requestedPath: req.params[0]
    });
  }
});

// Test image route
app.get('/api/test/image/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const imageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${folder}/${filename}`;
  
  console.log(`🧪 Testing image: ${imageUrl}`);
  res.redirect(imageUrl);
});

// ===== DEBUGGING ROUTES =====

// Health check with comprehensive info
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.db?.databaseName || 'Unknown'
    },
    services: {
      imageProxy: 'Active',
      cors: 'Enabled',
      routes: 'Loading...'
    }
  };
  
  console.log('🏥 Health check requested');
  res.json(healthStatus);
});

// Comprehensive database debugging
app.get('/api/debug/database', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not established'
      });
    }
    
    console.log('🔍 Database debug requested');
    
    // Connection info
    const connectionInfo = {
      cluster: mongoose.connection.host,
      database: db.databaseName,
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      connectionString: process.env.MONGODB_URI ? 'Set (hidden)' : 'Missing'
    };
    
    // List collections with detailed info
    const collections = await db.listCollections().toArray();
    const collectionInfo = {};
    
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        const sampleDoc = count > 0 ? await db.collection(collection.name).findOne() : null;
        
        collectionInfo[collection.name] = {
          documentCount: count,
          sampleDocument: sampleDoc ? {
            _id: sampleDoc._id,
            structure: {
              hasName: !!sampleDoc.name,
              hasImage: !!sampleDoc.image,
              hasStatus: !!sampleDoc.status,
              hasCategory: !!sampleDoc.category,
              hasFeatured: !!sampleDoc.featured,
              hasPrice: !!sampleDoc.price,
              hasInStock: !!sampleDoc.inStock
            },
            fields: Object.keys(sampleDoc).slice(0, 15)
          } : null
        };
      } catch (error) {
        collectionInfo[collection.name] = {
          error: error.message
        };
      }
    }
    
    // Diagnosis
    const expectedCollections = {
      pets: collectionInfo.pets || collectionInfo.Pet || collectionInfo.Pets || null,
      products: collectionInfo.products || collectionInfo.Product || collectionInfo.Products || null
    };
    
    const diagnosis = {
      totalCollections: collections.length,
      hasPetsData: !!(expectedCollections.pets?.documentCount > 0),
      hasProductsData: !!(expectedCollections.products?.documentCount > 0),
      databaseIssues: [],
      recommendations: []
    };
    
    // Generate specific issues and recommendations
    if (connectionInfo.database === 'test') {
      diagnosis.databaseIssues.push('Connected to "test" database - data likely in different database');
      diagnosis.recommendations.push('Update MONGODB_URI to include specific database name');
    }
    
    if (collections.length === 0) {
      diagnosis.databaseIssues.push('No collections found - database appears empty');
      diagnosis.recommendations.push('Import data or check if connected to correct database');
    }
    
    if (!expectedCollections.pets || expectedCollections.pets.documentCount === 0) {
      diagnosis.databaseIssues.push('No pets data found');
      diagnosis.recommendations.push('Check collection naming (pets vs Pet vs Pets) or import data');
    }
    
    if (!expectedCollections.products || expectedCollections.products.documentCount === 0) {
      diagnosis.databaseIssues.push('No products data found');
      diagnosis.recommendations.push('Check collection naming (products vs Product vs Products) or import data');
    }
    
    console.log(`📊 Database diagnostic: ${diagnosis.databaseIssues.length} issues found`);
    
    res.json({
      success: true,
      connection: connectionInfo,
      collections: collectionInfo,
      expectedCollections,
      diagnosis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route mounting status
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Route debugging information',
    environment: process.env.NODE_ENV,
    availableRoutes: [
      'GET /api/health - Server health check',
      'GET /api/debug/database - Database diagnostic',
      'GET /api/debug/routes - This route',
      'GET /api/debug/seed-exact - Seed database with sample data',
      'GET /api/images/{folder}/{filename} - Image proxy',
      'GET /api/test/image/{folder}/{filename} - Direct image test',
      'GET /api/pets - Pet listings (if routes mounted)',
      'GET /api/products - Product listings (if routes mounted)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Seeding route with exact data
app.post('/api/debug/seed-exact', async (req, res) => {
  try {
    console.log('🌱 Database seeding requested');
    
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    // Sample data based on your Atlas data
    const samplePets = [
      {
        "_id": "p025",
        "name": "Pet 25",
        "type": "small-pet",
        "breed": "Hedge Hog",
        "age": "6 months",
        "size": "small",
        "gender": "male",
        "description": "Pet 25 is a 6 months-old small-sized Hedge Hog pet with a charming personality. He is looking for a loving home where he can thrive and bring joy to your family.",
        "image": "pet/hedge-hog-A.jpg",
        "status": "available",
        "updatedAt": new Date("2025-07-07T00:26:00.806Z"),
        "createdBy": "685a27167282678964ac4420",
        "category": "other",
        "featured": true
      },
      {
        "_id": "p028",
        "name": "Koda",
        "type": "cat",
        "breed": "Mixed breed",
        "age": "6 months",
        "size": "medium",
        "gender": "male",
        "description": "Koda is a 6 months-old medium-sized Mixed breed cat with a charming personality. He is looking for a loving home where he can thrive and bring joy to your family.",
        "image": "pet/kitten.png",
        "status": "available",
        "updatedAt": new Date("2025-07-07T00:26:00.806Z"),
        "createdBy": "685a27167282678964ac4420",
        "category": "cat",
        "featured": true
      },
      {
        "_id": "p029",
        "name": "Maggie",
        "type": "dog",
        "breed": "Chocolate Labrador Retriever",
        "age": "6 months",
        "size": "medium",
        "gender": "female",
        "description": "Maggie is a 6 months-old medium-sized Chocolate Labrador Retriever dog with a charming personality. She is looking for a loving home where she can thrive and bring joy to your family.",
        "image": "pet/lab-puppy-B.png",
        "status": "available",
        "updatedAt": new Date("2025-07-07T00:26:00.806Z"),
        "createdBy": "685a27167282678964ac4420",
        "category": "dog",
        "featured": true
      },
      {
        "_id": "p001",
        "name": "Pet 1",
        "type": "fish",
        "breed": "Betas",
        "age": "6 months",
        "size": "medium",
        "gender": "unknown",
        "description": "Pet 1 is a 6 months-old medium-sized Betas fish with a charming personality. They is looking for a loving home where they can thrive and bring joy to your family.",
        "image": "pet/betas-fish.jpg",
        "status": "available",
        "updatedAt": new Date("2025-07-07T00:26:00.806Z"),
        "createdBy": "685a27167282678964ac4420",
        "category": "aquatic",
        "featured": true
      }
    ];

    const sampleProducts = [
      {
        "_id": "prod_002",
        "name": "Covered Litter Box",
        "category": "Cat Care",
        "brand": "Generic",
        "price": 9.99,
        "inStock": true,
        "description": "Give your feline friend privacy and keep odors contained with this spacious covered litter box.",
        "image": "product/covered-litter-box.png",
        "featured": true
      },
      {
        "_id": "prod_013",
        "name": "Premium Dog Food",
        "category": "Dog Care",
        "brand": "Generic",
        "price": 9.99,
        "inStock": true,
        "description": "Treat your dog to restaurant-quality nutrition with this premium dog food formula.",
        "image": "product/premum-dog-food.png",
        "featured": true
      }
    ];
    
    // Clear and insert data
    console.log('🗑️ Clearing existing data...');
    await db.collection('pets').deleteMany({});
    await db.collection('products').deleteMany({});
    
    console.log('📥 Inserting sample data...');
    const petResult = await db.collection('pets').insertMany(samplePets);
    const productResult = await db.collection('products').insertMany(sampleProducts);
    
    console.log(`✅ Inserted ${petResult.insertedCount} pets`);
    console.log(`✅ Inserted ${productResult.insertedCount} products`);
    
    res.json({
      success: true,
      message: 'Database seeded with sample data!',
      inserted: {
        pets: petResult.insertedCount,
        products: productResult.insertedCount
      },
      sampleUrls: {
        petImage: `${req.protocol}://${req.get('host')}/api/images/pet/hedge-hog-A.jpg`,
        productImage: `${req.protocol}://${req.get('host')}/api/images/product/covered-litter-box.png`
      },
      nextSteps: [
        'Test: GET /api/pets',
        'Test: GET /api/products',
        'Test image loading in frontend'
      ]
    });
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// ===== ROUTE MOUNTING WITH DEBUGGING =====
const mountRoute = (path, routePath, routeName) => {
  try {
    console.log(`🔍 Loading route: ${routeName} from ${routePath}`);
    const route = require(routePath);
    app.use(path, route);
    console.log(`✅ Mounted route: ${path} (${routeName})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to mount route ${routeName}:`, error.message);
    
    // Create fallback route that explains the error
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route ${routeName} failed to load`,
        error: error.message,
        path: routePath,
        suggestion: `Check if ${routePath} exists and exports a valid Express router`,
        timestamp: new Date().toISOString()
      });
    });
    
    return false;
  }
};

// Mount routes with debugging
console.log('📂 Mounting API routes...');
const routes = [
  { path: '/api/pets', file: './routes/pets', name: 'Pets' },
  { path: '/api/products', file: './routes/products', name: 'Products' },
  { path: '/api/users', file: './routes/users', name: 'Users' },
  { path: '/api/admin', file: './routes/admin', name: 'Admin' },
  { path: '/api/news', file: './routes/news', name: 'News' },
  { path: '/api/contact', file: './routes/contact', name: 'Contact' }
];

let successCount = 0;
const routeResults = {};

routes.forEach(({ path, file, name }) => {
  const success = mountRoute(path, file, name);
  routeResults[name.toLowerCase()] = success;
  if (success) successCount++;
});

console.log(`🎯 Routes mounted: ${successCount}/${routes.length}`);

if (successCount === 0) {
  console.warn('⚠️ No routes mounted successfully - using debug endpoints only');
}

// ===== ERROR HANDLING =====
// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/debug/database',
      'GET /api/debug/routes',
      'POST /api/debug/seed-exact',
      'GET /api/images/{folder}/{filename}',
      ...(successCount > 0 ? ['GET /api/pets', 'GET /api/products'] : ['Routes failed to mount - check logs'])
    ],
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Global error handler:', err);
  
  const errorResponse = {
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// ===== STATIC FILES (PRODUCTION) =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    console.log(`📁 Serving static files from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn('⚠️ Frontend build directory not found');
    app.get('*', (req, res) => {
      res.json({
        message: 'FurBabies API Server',
        status: 'API Only - Frontend build not found',
        debug: '/api/debug/database'
      });
    });
  }
}

// ===== SERVER STARTUP =====
const startServer = async () => {
  try {
    console.log('🔧 Initializing database connection...');
    await connectDB();
    
    console.log('🚀 Starting HTTP server...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 ===== FURBABIES SERVER STARTED =====');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🗃️ Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log(`📂 Routes: ${successCount}/${routes.length} mounted`);
      console.log(`🖼️ Images: CORS proxy enabled`);
      console.log('');
      console.log('🔗 Debug endpoints:');
      console.log(`   Health: /api/health`);
      console.log(`   Database: /api/debug/database`);
      console.log(`   Routes: /api/debug/routes`);
      console.log(`   Seed DB: POST /api/debug/seed-exact`);
      console.log('');
      console.log('🔗 API endpoints:');
      console.log(`   Pets: /api/pets`);
      console.log(`   Products: /api/products`);
      console.log(`   Images: /api/images/{folder}/{filename}`);
      console.log('');
      console.log('✅ Server ready for requests!');
      console.log(`🌐 Access at: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();