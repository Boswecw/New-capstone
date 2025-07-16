// server/server.js - FIXED for Your Existing MongoDB Data Structure
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production, or specify your domain
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ===== SCHEMAS FOR YOUR EXISTING DATA =====
const petSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Your IDs are strings like "p025"
  name: String,
  type: String,
  breed: String,
  age: String,
  size: String,
  gender: String,
  description: String,
  image: String,
  status: String,
  updatedAt: Date,
  createdBy: mongoose.Schema.Types.ObjectId,
  category: String,
  featured: Boolean
}, { _id: false }); // Disable auto ObjectId since you use custom string IDs

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Your IDs are strings like "prod_001"
  name: String,
  category: String,
  brand: String,
  price: Number,
  inStock: Boolean,
  description: String,
  image: String,
  featured: mongoose.Schema.Types.Mixed // Handle both boolean true and string "true"
}, { _id: false });

const Pet = mongoose.model('Pet', petSchema);
const Product = mongoose.model('Product', productSchema);

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const petCount = await Pet.countDocuments();
    const productCount = await Product.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'FurBabies API is running',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      collections: {
        pets: petCount,
        products: productCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection issue',
      error: error.message
    });
  }
});

// ===== FEATURED PETS ENDPOINT (Random Selection) =====
app.get('/api/pets/featured', async (req, res) => {
  try {
    console.log('🏠 GET /api/pets/featured - Random selection requested');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Get random featured pets using aggregation
    const featuredPets = await Pet.aggregate([
      { 
        $match: { 
          featured: true, 
          status: 'available' 
        } 
      },
      { $sample: { size: limit } }, // Random selection
      {
        $addFields: {
          imageUrl: {
            $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"]
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Pet"] },
          isAvailable: { $eq: ["$status", "available"] }
        }
      }
    ]);

    console.log(`🏠 Returning ${featuredPets.length} random featured pets`);
    
    res.json({
      success: true,
      data: featuredPets,
      count: featuredPets.length,
      message: `${featuredPets.length} featured pets selected randomly`
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

// ===== FEATURED PRODUCTS ENDPOINT (Random Selection) =====
app.get('/api/products/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured - Random selection requested');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Get random featured products using aggregation
    // NOTE: Products have featured as STRING "true", not boolean true
    const featuredProducts = await Product.aggregate([
      { 
        $match: { 
          $or: [
            { featured: true },      // Handle boolean true
            { featured: "true" }     // Handle string "true"
          ],
          inStock: true 
        } 
      },
      { $sample: { size: limit } }, // Random selection
      {
        $addFields: {
          imageUrl: {
            $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"]
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Product"] },
          formattedPrice: {
            $concat: ["$", { $toString: "$price" }]
          }
        }
      }
    ]);

    console.log(`🛒 Returning ${featuredProducts.length} random featured products`);
    
    res.json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length,
      message: `${featuredProducts.length} featured products selected randomly`
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

// ===== ALL PETS ENDPOINT (For Browse Page) =====
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = { status: 'available' };

    // Apply filters
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.breed && req.query.breed !== 'all') {
      query.breed = new RegExp(req.query.breed, 'i');
    }
    
    if (req.query.featured === 'true') {
      query.$or = [
        { featured: true },      // Handle boolean true
        { featured: "true" }     // Handle string "true"
      ];
    }

    // Search functionality
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
    let sortOptions = { updatedAt: -1 }; // Default: most recently updated
    
    switch (req.query.sort) {
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'newest':
        sortOptions = { updatedAt: -1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, updatedAt: -1 };
        break;
    }

    // Execute query
    const total = await Pet.countDocuments(query);
    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();

    // Add computed fields
    const enrichedPets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available'
    }));

    console.log(`🐕 Found ${enrichedPets.length} pets (Total: ${total})`);

    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + enrichedPets.length < total
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

    const query = {};

    // Apply filters
    if (req.query.category && req.query.category !== 'all') {
      query.category = new RegExp(req.query.category, 'i');
    }
    
    if (req.query.inStock === 'true') {
      query.inStock = true;
    }
    
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { brand: searchRegex }
      ];
    }

    // Pagination
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Execute query
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ name: 1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Add computed fields
    const enrichedProducts = products.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'
    }));

    console.log(`🛒 Found ${enrichedProducts.length} products (Total: ${total})`);

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length
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
    
    // Your IDs are strings, so we can query directly
    const pet = await Pet.findById(req.params.id).lean();

    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    // Add computed fields
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

    // Add computed fields
    const enrichedProduct = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'
    };
    
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
      'GET /api/products/:id'
    ]
  });
});

// ===== SERVE REACT FRONTEND IN PRODUCTION =====
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/build');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 FurBabies Server starting...');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Database: Connected to MongoDB Atlas`);
      console.log('✅ Server is running successfully!');
      console.log('\n📍 Available endpoints:');
      console.log('   🏠 Featured pets: /api/pets/featured?limit=4');
      console.log('   🛒 Featured products: /api/products/featured?limit=4');
      console.log('   🔍 Browse pets: /api/pets');
      console.log('   🛍️ Browse products: /api/products');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});