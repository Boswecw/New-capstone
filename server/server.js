// server/server.js - UPDATED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Simple Pet and Product schemas
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FurBabies server is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// PETS ENDPOINTS
// Get all pets with filtering and pagination
app.get('/api/pets', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);
    
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
    
    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Sorting
    let sortOptions = { createdAt: -1 };
    if (req.query.sort === 'name') sortOptions = { name: 1 };
    if (req.query.sort === 'age') sortOptions = { age: 1 };
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
    
    console.log(`🐕 Found ${enrichedPets.length} pets (Total: ${total})`);
    
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