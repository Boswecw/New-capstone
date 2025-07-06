const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePetQuery, validateObjectId } = require('../middleware/validation');

// GET /api/pets/featured - Get random pets as featured
router.get('/featured', async (req, res) => {
  try {
    console.log('🌟 Fetching random featured pets...');
    const { limit = 6 } = req.query;

    const featuredPets = await Pet.aggregate([
      { $match: { status: 'available' } }, // ✅ Only show available pets
      { $sample: { size: parseInt(limit) } }
    ]);

    console.log(`✅ Found ${featuredPets.length} random featured pets`);
    res.json({ success: true, data: featuredPets });
  } catch (error) {
    console.error('❌ Error fetching featured pets:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching featured pets', error: error.message });
  }
});

// GET /api/pets - Get all pets or random if featured=true
router.get('/', validatePetQuery, optionalAuth, async (req, res) => {
  try {
    const {
      category,
      type,
      age,
      size,
      gender,
      search,
      featured,
      available,    // ✅ ADDED - Filter by availability
      status,       // ✅ ADDED - Filter by status
      minPrice,     // ✅ ADDED - Price range filtering
      maxPrice,     // ✅ ADDED - Price range filtering
      limit = 12,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    if (featured === 'true') {
      const featuredPets = await Pet.aggregate([
        { $match: { status: 'available' } }, // ✅ Only show available pets
        { $sample: { size: parseInt(limit) } }
      ]);
      return res.json({
        success: true,
        data: featuredPets,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalPets: featuredPets.length,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Normal filtered pet list
    const query = {};

    // Basic filters
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type; // ✅ Enhanced type filtering
    if (age) query.age = { $lte: parseInt(age) };
    if (size) query.size = size;
    if (gender) query.gender = gender;

    // ✅ ADDED - Availability filtering
    if (available !== undefined && available !== '') {
      query.available = available === 'true';
    }

    // ✅ ADDED - Status filtering
    if (status) {
      query.status = status;
    } else {
      // Default to only show available pets for public browsing
      query.status = 'available';
    }

    // ✅ ADDED - Price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // ✅ Enhanced sorting options
    const sortOptions = {};
    switch (sort) {
      case 'name': 
        sortOptions.name = 1; 
        break;
      case 'age': 
        sortOptions.age = 1; 
        break;
      case 'price-low': 
        sortOptions.price = 1; 
        break;
      case 'price-high': 
        sortOptions.price = -1; 
        break;
      case 'type': 
        sortOptions.type = 1; 
        break;
      case 'newest': 
        sortOptions.createdAt = -1; 
        break;
      case 'oldest': 
        sortOptions.createdAt = 1; 
        break;
      case 'popular': 
        sortOptions.views = -1; 
        break;
      default: 
        sortOptions.createdAt = -1;
    }

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean();

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    // ✅ Debug logging for consistency
    console.log('🔍 Public pets query:', query);
    console.log('📊 Total pets found:', totalPets);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: limitNum
      },
      // ✅ Include applied filters in response
      filters: {
        category,
        type,
        age,
        size,
        gender,
        search,
        available,
        status,
        minPrice,
        maxPrice,
        sort
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pets:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pets', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;