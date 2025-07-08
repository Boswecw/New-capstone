// server/routes/pets.js - SIMPLE VERSION with basic validation
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePetQuery, validatePetId } = require('../middleware/validation');

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

// GET /api/pets - Get all pets
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

// GET /api/pets/:id - Get single pet by ID with simple validation
router.get('/:id', validatePetId, optionalAuth, async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🔍 Fetching pet with ID: ${petId}`);
    
    const pet = await Pet.findById(petId)
      .populate('createdBy', 'name email')
      .populate('adoptedBy', 'name email');

    if (!pet) {
      console.log(`❌ Pet not found: ${petId}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Increment view count
    try {
      pet.views = (pet.views || 0) + 1;
      await pet.save();
    } catch (saveError) {
      console.log('Failed to increment view count:', saveError.message);
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
      error: error.message
    });
  }
});

// POST /api/pets/:id/vote - Vote on a pet
router.post('/:id/vote', protect, validatePetId, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    const pet = await Pet.findById(petId);
    
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
    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    // Simple voting - just increment the count
    pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
    
    await pet.save();

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