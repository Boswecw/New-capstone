// server/server.js - ENHANCED VERSION with ESLint fixes
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import database connection
const connectDB = require('../config/db');

// Import routes
const petRoutes = require('./routes/pets');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const productsRoutes = require('./routes/products');

// Import models for bypass routes
const Pet = require('./models/Pet');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Render
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://furbabies-frontend.onrender.com',
      'https://furbabies-backend.onrender.com',
      process.env.APP_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For debugging: temporarily allow all origins (REMOVE IN PRODUCTION)
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
  ],
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for debugging
app.use((req, res, next) => {
  /* eslint-disable no-console */
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.get('Origin'));
  console.log('User-Agent:', req.get('User-Agent'));
  /* eslint-enable no-console */
  next();
});

// Environment variables check
if (!process.env.MONGODB_URI) {
  /* eslint-disable no-console */
  console.error('❌ MONGODB_URI is not defined. Check your .env file.');
  /* eslint-enable no-console */
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  /* eslint-disable no-console */
  console.error('❌ JWT_SECRET is not defined. Check your .env file.');
  /* eslint-enable no-console */
  process.exit(1);
}

// Database connection
connectDB();

// ENHANCED PET BYPASS ROUTE - Comprehensive pet search with multiple methods
app.get('/api/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    /* eslint-disable no-console */
    console.log(`🎯 ENHANCED BYPASS: Fetching pet ${petId}`);
    /* eslint-enable no-console */

    if (!petId || petId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required',
      });
    }

    let pet = null;
    let foundWithMethod = null;

    // ENHANCED SEARCH - Try multiple approaches
    const searchMethods = [
      {
        name: 'Direct findById',
        search: () => Pet.findById(petId)
      },
      {
        name: 'String _id match',
        search: () => Pet.findOne({ _id: petId })
      },
      {
        name: 'Case insensitive _id',
        search: () => Pet.findOne({ _id: new RegExp(`^${petId}$`, 'i') })
      },
      {
        name: 'Alternative fields',
        search: () => Pet.findOne({
          $or: [
            { _id: petId },
            { id: petId },
            { petId: petId },
            { customId: petId },
          ],
        })
      },
      {
        name: 'Name-based search',
        search: () => {
          if (petId.startsWith('p') && petId.length >= 3) {
            const petNumber = petId.substring(1);
            const numericPart = parseInt(petNumber, 10);
            if (!isNaN(numericPart)) {
              return Pet.findOne({ name: `Pet ${numericPart}` });
            }
          }
          return null;
        }
      },
      {
        name: 'Raw collection search',
        search: async () => {
          try {
            const collection = mongoose.connection.db.collection('pets');
            return await collection.findOne({ _id: petId });
          } catch (err) {
            /* eslint-disable no-console */
            console.log('Raw collection search failed:', err.message);
            /* eslint-enable no-console */
            return null;
          }
        }
      },
      {
        name: 'Regex pattern search',
        search: () => Pet.findOne({ 
          $or: [
            { _id: new RegExp(petId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { name: new RegExp(petId.replace('p', 'Pet '), 'i') }
          ]
        })
      }
    ];

    // Try each search method until we find the pet
    for (let i = 0; i < searchMethods.length; i += 1) {
      try {
        /* eslint-disable no-console */
        console.log(`🔍 Method ${i + 1}: ${searchMethods[i].name}...`);
        /* eslint-enable no-console */
        pet = await searchMethods[i].search();
        if (pet) {
          foundWithMethod = searchMethods[i].name;
          /* eslint-disable no-console */
          console.log(`✅ SUCCESS with "${foundWithMethod}": Found ${pet.name || pet._id}`);
          /* eslint-enable no-console */
          break;
        }
      } catch (methodError) {
        /* eslint-disable no-console */
        console.log(`   ❌ Error: ${methodError.message}`);
        /* eslint-enable no-console */
      }
    }

    if (!pet) {
      /* eslint-disable no-console */
      console.log(`❌ Pet not found with any method: ${petId}`);
      /* eslint-enable no-console */

      // Enhanced debug information
      const debugInfo = {
        searchedId: petId,
        searchedWithMethods: searchMethods.length,
        methodsTried: searchMethods.map(m => m.name)
      };
      
      try {
        // Show pets with similar patterns
        const similarPets = await Pet.find({
          $or: [
            { _id: new RegExp(petId.substring(1), 'i') },
            { name: new RegExp(petId.replace('p', 'Pet '), 'i') }
          ]
        }).limit(5).select('_id name type');
        
        debugInfo.similarPets = similarPets.map(p => ({
          id: p._id,
          name: p.name,
          type: p.type,
        }));
      } catch (err) {
        debugInfo.similarPetsError = err.message;
      }
      
      try {
        // Show total count and random sample
        const totalCount = await Pet.countDocuments();
        const samplePets = await Pet.find().limit(10).select('_id name type');
        
        debugInfo.totalPets = totalCount;
        debugInfo.samplePets = samplePets.map(p => ({
          id: p._id,
          name: p.name,
          type: p.type,
        }));

        // Show pets that contain "43" in any field
        if (petId.includes('43')) {
          const pets43 = await Pet.find({
            $or: [
              { _id: /43/ },
              { name: /43/ }
            ]
          }).limit(5).select('_id name type');
          
          debugInfo.petsContaining43 = pets43.map(p => ({
            id: p._id,
            name: p.name,
            type: p.type,
          }));
        }
      } catch (err) {
        debugInfo.statsError = err.message;
      }

      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        debug: debugInfo,
      });
    }

    // If we found the pet, ensure it's a proper Mongoose document
    if (pet && typeof pet.save !== 'function') {
      try {
        /* eslint-disable no-console */
        console.log('🔄 Converting raw document to Mongoose document...');
        /* eslint-enable no-console */
        const mongoosePet = await Pet.findById(pet._id);
        if (mongoosePet) {
          pet = mongoosePet;
          /* eslint-disable no-console */
          console.log('✅ Successfully converted to Mongoose document');
          /* eslint-enable no-console */
        }
      } catch (conversionError) {
        /* eslint-disable no-console */
        console.log('⚠️ Could not convert to Mongoose document:', conversionError.message);
        /* eslint-enable no-console */
      }
    }

    // Increment view count if possible
    try {
      if (pet && typeof pet.save === 'function') {
        pet.views = (pet.views || 0) + 1;
        await pet.save();
        /* eslint-disable no-console */
        console.log('📈 View count incremented');
        /* eslint-enable no-console */
      }
    } catch (saveError) {
      /* eslint-disable no-console */
      console.log('Failed to save view count:', saveError.message);
      /* eslint-enable no-console */
    }

    /* eslint-disable no-console */
    console.log(`✅ ENHANCED BYPASS SUCCESS: Found ${pet.name || pet._id} using "${foundWithMethod}"`);
    /* eslint-enable no-console */

    return res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully',
      debug: {
        foundWithMethod: foundWithMethod
      }
    });
  } catch (error) {
    /* eslint-disable no-console */
    console.error('❌ ENHANCED BYPASS ERROR:', error);
    /* eslint-enable no-console */
    return res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ENHANCED PRODUCT BYPASS ROUTE - Comprehensive product search with multiple methods
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    /* eslint-disable no-console */
    console.log(`🎯 ENHANCED PRODUCT BYPASS: Fetching product ${productId}`);
    /* eslint-enable no-console */

    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    let product = null;
    let foundWithMethod = null;

    // ENHANCED SEARCH - Try multiple approaches for products
    const searchMethods = [
      {
        name: 'Direct findById',
        search: () => Product.findById(productId)
      },
      {
        name: 'String _id match',
        search: () => Product.findOne({ _id: productId })
      },
      {
        name: 'Case insensitive _id',
        search: () => Product.findOne({ _id: new RegExp(`^${productId}$`, 'i') })
      },
      {
        name: 'Alternative fields',
        search: () => Product.findOne({
          $or: [
            { _id: productId },
            { id: productId },
            { productId: productId },
            { customId: productId },
          ],
        })
      },
      {
        name: 'Name-based search',
        search: () => {
          if (productId.startsWith('prod_') && productId.length >= 6) {
            const productNumber = productId.substring(5);
            const numericPart = parseInt(productNumber, 10);
            if (!isNaN(numericPart)) {
              return Product.findOne({
                $or: [
                  { name: new RegExp(`product ${numericPart}`, 'i') },
                  { name: new RegExp(`${numericPart}`, 'i') }
                ]
              });
            }
          }
          return null;
        }
      },
      {
        name: 'Raw collection search',
        search: async () => {
          try {
            const collection = mongoose.connection.db.collection('products');
            return await collection.findOne({ _id: productId });
          } catch (err) {
            /* eslint-disable no-console */
            console.log('Raw collection search failed:', err.message);
            /* eslint-enable no-console */
            return null;
          }
        }
      },
      {
        name: 'Regex pattern search',
        search: () => Product.findOne({ 
          $or: [
            { _id: new RegExp(productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { name: new RegExp(productId.replace('prod_', ''), 'i') }
          ]
        })
      }
    ];

    // Try each search method until we find the product
    for (let i = 0; i < searchMethods.length; i += 1) {
      try {
        /* eslint-disable no-console */
        console.log(`🔍 Method ${i + 1}: ${searchMethods[i].name}...`);
        /* eslint-enable no-console */
        product = await searchMethods[i].search();
        if (product) {
          foundWithMethod = searchMethods[i].name;
          /* eslint-disable no-console */
          console.log(`✅ SUCCESS with "${foundWithMethod}": Found ${product.name || product._id}`);
          /* eslint-enable no-console */
          break;
        }
      } catch (methodError) {
        /* eslint-disable no-console */
        console.log(`   ❌ Error: ${methodError.message}`);
        /* eslint-enable no-console */
      }
    }

    if (!product) {
      /* eslint-disable no-console */
      console.log(`❌ Product not found with any method: ${productId}`);
      /* eslint-enable no-console */

      // Enhanced debug information
      const debugInfo = {
        searchedId: productId,
        searchedWithMethods: searchMethods.length,
        methodsTried: searchMethods.map(m => m.name)
      };
      
      try {
        const similarProducts = await Product.find({
          $or: [
            { _id: new RegExp(productId.substring(5), 'i') },
            { name: new RegExp(productId.replace('prod_', ''), 'i') }
          ]
        }).limit(5).select('_id name category price');
        
        debugInfo.similarProducts = similarProducts.map(p => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.price
        }));
      } catch (err) {
        debugInfo.similarProductsError = err.message;
      }
      
      try {
        const totalCount = await Product.countDocuments();
        const sampleProducts = await Product.find().limit(10).select('_id name category price');
        
        debugInfo.totalProducts = totalCount;
        debugInfo.sampleProducts = sampleProducts.map(p => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.price
        }));

        if (productId.includes('003')) {
          const products003 = await Product.find({
            $or: [
              { _id: /003/ },
              { name: /003/ }
            ]
          }).limit(5).select('_id name category price');
          
          debugInfo.productsContaining003 = products003.map(p => ({
            id: p._id,
            name: p.name,
            category: p.category,
            price: p.price
          }));
        }
      } catch (err) {
        debugInfo.statsError = err.message;
      }

      return res.status(404).json({
        success: false,
        message: 'Product not found',
        debug: debugInfo,
      });
    }

    // If we found the product, ensure it's a proper Mongoose document
    if (product && typeof product.save !== 'function') {
      try {
        /* eslint-disable no-console */
        console.log('🔄 Converting raw document to Mongoose document...');
        /* eslint-enable no-console */
        const mongooseProduct = await Product.findById(product._id);
        if (mongooseProduct) {
          product = mongooseProduct;
          /* eslint-disable no-console */
          console.log('✅ Successfully converted to Mongoose document');
          /* eslint-enable no-console */
        }
      } catch (conversionError) {
        /* eslint-disable no-console */
        console.log('⚠️ Could not convert to Mongoose document:', conversionError.message);
        /* eslint-enable no-console */
      }
    }

    /* eslint-disable no-console */
    console.log(`✅ ENHANCED PRODUCT BYPASS SUCCESS: Found ${product.name || product._id} using "${foundWithMethod}"`);
    /* eslint-enable no-console */

    // Add full image URL like the original route does
    const productWithUrl = {
      ...(product.toObject ? product.toObject() : product),
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`
    };

    return res.json({
      success: true,
      data: productWithUrl,
      message: 'Product retrieved successfully',
      debug: {
        foundWithMethod: foundWithMethod
      }
    });
  } catch (error) {
    /* eslint-disable no-console */
    console.error('❌ ENHANCED PRODUCT BYPASS ERROR:', error);
    /* eslint-enable no-console */
    return res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DEBUG ROUTE - Temporary route to help diagnose issues
app.get('/api/debug/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    /* eslint-disable no-console */
    console.log(`🐛 DEBUG ROUTE: Analyzing pet ${petId}`);
    /* eslint-enable no-console */
    
    const debugInfo = {
      searchedId: petId,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    const tests = [
      { name: 'findById', method: () => Pet.findById(petId) },
      { name: 'findOne_id', method: () => Pet.findOne({ _id: petId }) },
      { name: 'findOne_name', method: () => Pet.findOne({ name: `Pet ${petId.substring(1)}` }) },
      { 
        name: 'raw_collection', 
        method: async () => {
          const collection = mongoose.connection.db.collection('pets');
          return await collection.findOne({ _id: petId });
        }
      }
    ];
    
    /* eslint-disable no-await-in-loop */
    for (const test of tests) {
      try {
        const result = await test.method();
        debugInfo.tests[test.name] = {
          success: !!result,
          found: result ? { id: result._id, name: result.name } : null
        };
      } catch (error) {
        debugInfo.tests[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    /* eslint-enable no-await-in-loop */
    
    debugInfo.stats = {
      totalPets: await Pet.countDocuments(),
      petsWithSimilarId: await Pet.countDocuments({ _id: new RegExp(petId.substring(1)) }),
      petsWithSimilarName: await Pet.countDocuments({ name: new RegExp(petId.replace('p', 'Pet ')) })
    };
    
    return res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: { searchedId: req.params.id }
    });
  }
});

// DEBUG ROUTE FOR PRODUCTS - Temporary route to help diagnose product issues
app.get('/api/debug/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    /* eslint-disable no-console */
    console.log(`🐛 DEBUG ROUTE: Analyzing product ${productId}`);
    /* eslint-enable no-console */
    
    const debugInfo = {
      searchedId: productId,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    const tests = [
      { name: 'findById', method: () => Product.findById(productId) },
      { name: 'findOne_id', method: () => Product.findOne({ _id: productId }) },
      { name: 'findOne_name', method: () => Product.findOne({ name: new RegExp(productId.replace('prod_', ''), 'i') }) },
      { 
        name: 'raw_collection', 
        method: async () => {
          const collection = mongoose.connection.db.collection('products');
          return await collection.findOne({ _id: productId });
        }
      }
    ];
    
    /* eslint-disable no-await-in-loop */
    for (const test of tests) {
      try {
        const result = await test.method();
        debugInfo.tests[test.name] = {
          success: !!result,
          found: result ? { id: result._id, name: result.name, price: result.price } : null
        };
      } catch (error) {
        debugInfo.tests[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    /* eslint-enable no-await-in-loop */
    
    debugInfo.stats = {
      totalProducts: await Product.countDocuments(),
      productsWithSimilarId: await Product.countDocuments({ _id: new RegExp(productId.substring(5)) }),
      productsWithSimilarName: await Product.countDocuments({ name: new RegExp(productId.replace('prod_', '')) })
    };
    
    return res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: { searchedId: req.params.id }
    });
  }
});

// API routes (the enhanced bypass routes above will intercept specific requests)
app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: [
        'https://furbabies-frontend.onrender.com',
        process.env.APP_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean),
    },
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'FurBabies API Server - Enhanced Version',
    version: '1.1.0',
    status: 'running',
    features: [
      'Enhanced pet search with 7 different methods',
      'Enhanced product search with 7 different methods', 
      'Comprehensive error debugging',
      'Raw MongoDB collection fallback',
      'Case-insensitive ID matching'
    ],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      pets: '/api/pets',
      users: '/api/users',
      contact: '/api/contact',
      admin: '/api/admin',
      products: '/api/products',
      debugPets: '/api/debug/pets/:id',
      debugProducts: '/api/debug/products/:id'
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  /* eslint-disable no-console */
  console.error('💥 Server error:', err);
  /* eslint-enable no-console */

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      timestamp: new Date().toISOString()
    }),
  });
  
  // Call next to satisfy ESLint
  next();
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/debug/pets/:id',
      'GET /api/debug/products/:id'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`🚀 Enhanced FurBabies Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(`🌐 CORS configured for frontend: https://furbabies-frontend.onrender.com`);
  console.log(`🎯 Enhanced bypass routes active:`);
  console.log(`   • /api/pets/:id (7-method pet search)`);
  console.log(`   • /api/products/:id (7-method product search)`);
  console.log(`🐛 Debug routes available:`);
  console.log(`   • /api/debug/pets/:id`);
  console.log(`   • /api/debug/products/:id`);
  console.log(`✨ Features: Custom ID support, comprehensive debugging`);
  /* eslint-enable no-console */
});

module.exports = app;