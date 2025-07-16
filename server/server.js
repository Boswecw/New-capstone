// server.js - Complete Corrected Version for FurBabies Backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://furbabies-petstore.onrender.com',
        'https://new-capstone.onrender.com',
        'https://furbabies-frontend.onrender.com'
      ]
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ===== DATABASE SCHEMAS =====
const petSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom string IDs like "p025"
  name: { type: String, required: true },
  type: { type: String, required: true }, // dog, cat, fish, bird, small-pet
  breed: String,
  age: String,
  size: String,
  gender: String,
  description: String,
  image: String, // Path like "pet/hedge-hog-A.jpg"
  status: { type: String, default: 'available' }, // available, adopted, pending
  updatedAt: { type: Date, default: Date.now },
  createdBy: mongoose.Schema.Types.ObjectId,
  category: String, // dog, cat, aquatic, other
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { 
  _id: false, // Don't auto-generate ObjectId
  timestamps: true 
});

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom string IDs like "prod_002"
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  description: String,
  image: String, // Path like "product/covered-litter-box.png"
  featured: mongoose.Schema.Types.Mixed, // Handle both boolean true and string "true"
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { 
  _id: false,
  timestamps: true 
});

// Create indexes for better performance
petSchema.index({ featured: 1, status: 1 });
petSchema.index({ type: 1, status: 1 });
petSchema.index({ category: 1, status: 1 });
petSchema.index({ name: 'text', description: 'text', breed: 'text' });

productSchema.index({ featured: 1, inStock: 1 });
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ brand: 1, inStock: 1 });
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Pet = mongoose.model('Pet', petSchema);
const Product = mongoose.model('Product', productSchema);

// ===== UTILITY FUNCTIONS =====
const addImageUrl = (item) => {
  return {
    ...item,
    imageUrl: item.image ? `https://storage.googleapis.com/furbabies-petstore/${item.image}` : null,
    hasImage: !!item.image
  };
};

const addPetFields = (pet) => {
  return {
    ...addImageUrl(pet),
    displayName: pet.name || 'Unnamed Pet',
    isAvailable: pet.status === 'available',
    daysSincePosted: Math.floor((new Date() - new Date(pet.updatedAt || pet.createdAt)) / (1000 * 60 * 60 * 24))
  };
};

const addProductFields = (product) => {
  return {
    ...addImageUrl(product),
    displayName: product.name || 'Unnamed Product',
    formattedPrice: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'
  };
};

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const petCount = await Pet.countDocuments();
    const productCount = await Product.countDocuments();
    const featuredPets = await Pet.countDocuments({ featured: true, status: 'available' });
    const featuredProducts = await Product.countDocuments({
      $or: [{ featured: true }, { featured: "true" }],
      inStock: true
    });
    
    res.json({ 
      success: true, 
      message: 'FurBabies Backend API is running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      collections: {
        pets: petCount,
        products: productCount,
        featuredPets: featuredPets,
        featuredProducts: featuredProducts
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
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
            $cond: {
              if: { $ne: ["$image", null] },
              then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
              else: null
            }
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Pet"] },
          isAvailable: { $eq: ["$status", "available"] },
          daysSincePosted: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), { $ifNull: ["$updatedAt", "$createdAt"] }] },
                86400000 // milliseconds in a day
              ]
            }
          }
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
    // Handle both boolean true and string "true" for featured field
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
            $cond: {
              if: { $ne: ["$image", null] },
              then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
              else: null
            }
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Product"] },
          formattedPrice: {
            $cond: {
              if: { $ne: ["$price", null] },
              then: { $concat: ["$", { $toString: "$price" }] },
              else: "N/A"
            }
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

// ===== FEATURED NEWS ENDPOINT =====
app.get('/api/news/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured - Mock news data');
    
    const limit = parseInt(req.query.limit) || 3;
    
    // Mock news data (replace with real database when you add news collection)
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
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/adoption-center.jpg'
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
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/holiday-safety.jpg'
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
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/max-success.jpg'
      },
      {
        id: '4',
        title: 'Winter Pet Care Essentials',
        summary: 'Prepare your furry friends for winter weather with these essential care tips.',
        category: 'care',
        author: 'Dr. Mike Chen',
        featured: true,
        published: true,
        publishedAt: new Date('2024-11-28'),
        views: 892,
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/winter-care.jpg'
      },
      {
        id: '5',
        title: 'Volunteer Appreciation Event Success',
        summary: 'Celebrating our amazing volunteers who make a real difference in pets\' lives.',
        category: 'community',
        author: 'FurBabies Team',
        featured: true,
        published: true,
        publishedAt: new Date('2024-11-20'),
        views: 743,
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/volunteers.jpg'
      },
      {
        id: '6',
        title: 'Pet Training Workshop Series Announced',
        summary: 'Join our expert trainers for monthly workshops on pet behavior and training.',
        category: 'training',
        author: 'Jessica Smith',
        featured: true,
        published: true,
        publishedAt: new Date('2024-11-15'),
        views: 456,
        imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/training-workshop.jpg'
      }
    ];
    
    // Return random selection of news items
    const shuffled = mockNews.sort(() => 0.5 - Math.random());
    const selectedNews = shuffled.slice(0, limit);
    
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

// ===== ALL PETS ENDPOINT (Browse Page) =====
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = { status: 'available' }; // Only show available pets by default

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
    
    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }
    
    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
    }
    
    if (req.query.featured === 'true') {
      query.featured = true;
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
      case 'age':
        sortOptions = { age: 1 };
        break;
      case 'newest':
        sortOptions = { updatedAt: -1 };
        break;
      case 'oldest':
        sortOptions = { updatedAt: 1 };
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
    const enrichedPets = pets.map(addPetFields);

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
      },
      filters: {
        type: req.query.type || 'all',
        breed: req.query.breed || 'all',
        category: req.query.category || 'all',
        size: req.query.size || 'all',
        gender: req.query.gender || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest',
        featured: req.query.featured || 'all'
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
    
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i');
    }
    
    if (req.query.inStock === 'true') {
      query.inStock = true;
    } else if (req.query.inStock === 'false') {
      query.inStock = false;
    }
    
    if (req.query.featured === 'true') {
      // Handle both boolean true and string "true"
      query.$or = [
        { featured: true },      // Handle boolean true
        { featured: "true" }     // Handle string "true"
      ];
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { name: 1 }; // Default: alphabetical
    
    switch (req.query.sort) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, name: 1 };
        break;
      case 'category':
        sortOptions = { category: 1, name: 1 };
        break;
    }

    // Execute query
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean();

    // Add computed fields
    const enrichedProducts = products.map(addProductFields);

    console.log(`🛒 Found ${enrichedProducts.length} products (Total: ${total})`);

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + enrichedProducts.length < total
      },
      filters: {
        category: req.query.category || 'all',
        brand: req.query.brand || 'all',
        inStock: req.query.inStock || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'name',
        featured: req.query.featured || 'all'
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
      console.log('🐕 Pet not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    // Increment view count
    await Pet.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    // Add computed fields
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
      console.log('🛒 Product not found');
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Increment view count
    await Product.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    // Add computed fields
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

// ===== METADATA ENDPOINTS =====

// Get pet types
app.get('/api/pets/meta/types', async (req, res) => {
  try {
    const types = await Pet.distinct('type', { status: 'available' });
    
    const typesWithCount = await Promise.all(
      types.map(async (type) => {
        const count = await Pet.countDocuments({ 
          type: type, 
          status: 'available' 
        });
        return { 
          _id: type, 
          name: type.charAt(0).toUpperCase() + type.slice(1), 
          count,
          value: type 
        };
      })
    );
    
    res.json({ 
      success: true, 
      data: typesWithCount.filter(t => t.count > 0)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pet types', 
      error: error.message 
    });
  }
});

// Get product categories
app.get('/api/products/meta/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category, inStock: true });
        return { 
          _id: category, 
          name: category, 
          count,
          value: category 
        };
      })
    );
    
    res.json({ 
      success: true, 
      data: categoriesWithCount.filter(c => c.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// ===== CONTACT FORM ENDPOINT =====
app.post('/api/contact', async (req, res) => {
  try {
    console.log('📞 POST /api/contact - Contact form submission');
    
    const { name, email, subject, message, petId } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }
    
    // Here you would typically save to database and/or send email
    // For now, just return success
    console.log('Contact form data:', { name, email, subject, message, petId });
    
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
      'GET /api/pets/meta/types',
      'GET /api/products',
      'GET /api/products/featured?limit=4',
      'GET /api/products/:id',
      'GET /api/products/meta/categories',
      'GET /api/news/featured?limit=3',
      'POST /api/contact'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  
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
      console.log('\n🚀 FurBabies Backend Server Status:');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Database: Connected to MongoDB Atlas`);
      console.log(`   CORS: Enabled for production domains`);
      console.log('✅ Server is running successfully!');
      console.log('\n📍 Available endpoints:');
      console.log('   🏥 Health check: /api/health');
      console.log('   🏠 Featured pets: /api/pets/featured?limit=4');
      console.log('   🛒 Featured products: /api/products/featured?limit=4');
      console.log('   📰 Featured news: /api/news/featured?limit=3');
      console.log('   🔍 Browse pets: /api/pets');
      console.log('   🛍️ Browse products: /api/products');
      console.log('   📞 Contact form: POST /api/contact');
      console.log('\n🎯 Ready to serve your frontend!');
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