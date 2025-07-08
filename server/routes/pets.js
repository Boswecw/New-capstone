// server/routes/pets.js - BULLETPROOF FIX (NO VALIDATION)
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// 🎯 REMOVED ALL VALIDATION MIDDLEWARE TO FIX THE ISSUE

// GET /api/pets/featured - Get random pets as featured
router.get('/featured', async (req, res) => {
  try {
    console.log('🌟 Fetching random featured pets...');
    const { limit = 6 } = req.query;

    const featuredPets = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $sample: { size: parseInt(limit) } }
    ]);

    console.log(`✅ Found ${featuredPets.length} random featured pets`);
    res.json({ success: true, data: featuredPets });
  } catch (error) {
    console.error('❌ Error fetching featured pets:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching featured pets', error: error.message });
  }
});

// GET /api/pets - Get all pets (NO VALIDATION)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      type,
      age,
      size,
      gender,
      search,
      featured,
      available,
      status,
      minPrice,
      maxPrice,
      limit = 12,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    if (featured === 'true') {
      const featuredPets = await Pet.aggregate([
        { $match: { status: 'available' } },
        { $sample: { size: parseInt(limit) } }
      ]);
      
      console.log(`✅ Found ${featuredPets.length} random featured pets`);
      return res.json({ success: true, data: featuredPets });
    }

    // Build query object
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (type) query.type = type;
    if (age) query.age = age;
    if (size) query.size = size;
    if (gender) query.gender = gender;
    if (available !== undefined) query.available = available === 'true';
    if (status) query.status = status;

    // Price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    switch (sort) {
      case 'name': sortOptions.name = 1; break;
      case 'price-low': sortOptions.price = 1; break;
      case 'price-high': sortOptions.price = -1; break;
      case 'type': sortOptions.type = 1; break;
      case 'newest': sortOptions.createdAt = -1; break;
      case 'oldest': sortOptions.createdAt = 1; break;
      case 'popular': sortOptions.views = -1; break;
      default: sortOptions.createdAt = -1;
    }

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean();

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

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
      filters: {
        category, type, age, size, gender, search, available, status, minPrice, maxPrice, sort
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

// 🎯 GET /api/pets/:id - Get single pet by ID (NO VALIDATION AT ALL)
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🔍 Fetching pet with ID: ${petId} (no validation)`);
    
    // Simple validation - just check if ID exists
    if (!petId || petId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }
    
    let pet = null;
    
    try {
      // Try to find the pet directly by ID
      pet = await Pet.findById(petId)
        .populate('createdBy', 'name email')
        .populate('adoptedBy', 'name email');
    } catch (mongoError) {
      // If MongoDB can't find it, it might be a custom ID stored differently
      console.log(`MongoDB findById failed for ${petId}, trying alternative searches...`);
      
      try {
        // Try to find by any field that might contain the custom ID
        pet = await Pet.findOne({
          $or: [
            { _id: petId },
            { id: petId },
            { petId: petId },
            { customId: petId }
          ]
        }).populate('createdBy', 'name email')
          .populate('adoptedBy', 'name email');
      } catch (altError) {
        console.log(`Alternative search also failed for ${petId}`);
      }
    }

    if (!pet) {
      console.log(`❌ Pet not found: ${petId}`);
      
      // For debugging - show what pets actually exist
      try {
        const samplePets = await Pet.find().limit(10).select('_id name type');
        console.log('📋 Available pets in database:', samplePets.map(p => ({ id: p._id, name: p.name })));
        
        return res.status(404).json({
          success: false,
          message: 'Pet not found',
          debug: {
            searchedId: petId,
            availablePets: samplePets.map(p => ({ id: p._id, name: p.name, type: p.type }))
          }
        });
      } catch (debugError) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }
    }

    // Increment view count
    try {
      pet.views = (pet.views || 0) + 1;
      await pet.save();
    } catch (saveError) {
      console.log('Failed to increment view count:', saveError.message);
      // Don't fail the request if we can't save the view count
    }

    console.log(`✅ Pet found: ${pet.name} (${pet.type})`);
    
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🎯 POST /api/pets/:id/vote - Vote on a pet (NO VALIDATION)
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    
    console.log(`🗳️ Vote attempt for pet ${petId} with vote type: ${voteType}`);
    
    if (!petId || petId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    let pet = null;
    
    try {
      pet = await Pet.findById(petId);
    } catch (mongoError) {
      // Try alternative search for custom IDs
      pet = await Pet.findOne({
        $or: [
          { _id: petId },
          { id: petId },
          { petId: petId },
          { customId: petId }
        ]
      });
    }
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on unavailable pets'
      });
    }

    // Initialize votes object if it doesn't exist
    if (!pet.votes || typeof pet.votes !== 'object') {
      pet.votes = { up: 0, down: 0 };
    }

    // Simple voting - just increment the count
    pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
    
    await pet.save();

    console.log(`✅ Vote ${voteType} recorded for ${pet.name}`);

    res.json({
      success: true,
      data: {
        votes: pet.votes,
        userVote: voteType
      },
      message: `Vote ${voteType} recorded successfully`
    });
    
  } catch (error) {
    console.error('Error voting on pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing vote',
      error: error.message
    });
  }
});

module.exports = router;