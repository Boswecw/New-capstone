// server/routes/pets.js - ZERO VALIDATION VERSION (for debugging)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// NO VALIDATION IMPORTS - We're testing without any validation

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
    console.log('📋 GET /api/pets - no validation version');
    
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

// 🎯 GET /api/pets/:id - ZERO VALIDATION VERSION
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🎯 NO VALIDATION: Fetching pet with ID: ${petId}`);
    console.log(`🎯 Pet ID type: ${typeof petId}, length: ${petId.length}`);
    
    // Log the exact request
    console.log(`🎯 Full request URL: ${req.originalUrl}`);
    console.log(`🎯 Request params:`, req.params);
    
    let pet = null;

    if (mongoose.Types.ObjectId.isValid(petId)) {
      try {
        console.log(`🎯 Trying Pet.findById("${petId}")`);
        pet = await Pet.findById(petId);
        console.log(`🎯 Direct findById result:`, pet ? `Found ${pet.name}` : 'Not found');
      } catch (directError) {
        console.log(`🎯 Direct findById failed:`, directError.message);
      }
    }

    if (!pet) {
      try {
        console.log(`🎯 Trying raw collection search for: ${petId}`);
        const rawPet = await mongoose.connection.db.collection('pets').findOne({ _id: petId });
        if (rawPet) {
          pet = new Pet(rawPet);
        }
        console.log(`🎯 Raw search result:`, pet ? `Found ${pet.name}` : 'Not found');
      } catch (altError) {
        console.log(`🎯 Raw search failed:`, altError.message);
      }
    }

    if (!pet) {
      console.log(`❌ Pet not found: ${petId}`);
      
      // Show what pets actually exist in database
      try {
        const allPets = await Pet.find().limit(20).select('_id name type');
        console.log(`📋 First 20 pets in database:`, allPets.map(p => ({ id: p._id, name: p.name })));
        
        return res.status(404).json({
          success: false,
          message: 'Pet not found',
          searchedId: petId,
          availablePets: allPets.map(p => ({ id: p._id, name: p.name, type: p.type }))
        });
      } catch (debugError) {
        console.log(`❌ Debug query failed:`, debugError.message);
        return res.status(404).json({
          success: false,
          message: 'Pet not found',
          searchedId: petId
        });
      }
    }

    // Found the pet - increment view count
    try {
      pet.views = (pet.views || 0) + 1;
      await pet.save();
      console.log(`📈 Incremented view count for ${pet.name}`);
    } catch (saveError) {
      console.log(`⚠️ Failed to save view count:`, saveError.message);
    }

    console.log(`✅ SUCCESS: Found pet ${pet.name} (${pet.type}) with ID: ${pet._id}`);
    
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully (no validation)',
      debug: {
        requestedId: petId,
        foundId: pet._id,
        petName: pet.name
      }
    });
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in pet detail route:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message,
      requestedId: req.params.id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/pets/:id/vote - Vote on a pet (NO VALIDATION)
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    
    console.log(`🗳️ NO VALIDATION: Vote ${voteType} for pet ${petId}`);
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    let pet = null;

    if (mongoose.Types.ObjectId.isValid(petId)) {
      try {
        pet = await Pet.findById(petId);
      } catch (findError) {
        console.log(`🗳️ Pet findById failed:`, findError.message);
      }
    }

    if (!pet) {
      try {
        const rawPet = await mongoose.connection.db.collection('pets').findOne({ _id: petId });
        if (rawPet) {
          pet = new Pet(rawPet);
        }
      } catch (altError) {
        console.log(`🗳️ Raw pet lookup failed:`, altError.message);
      }
    }
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found for voting'
      });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on unavailable pets'
      });
    }

    // Initialize votes
    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    // Simple voting
    pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
    await pet.save();

    console.log(`✅ Vote recorded: ${voteType} for ${pet.name}`);

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