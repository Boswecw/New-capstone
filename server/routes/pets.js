// server/routes/pets.js - UPDATED with Proper Custom Pet ID Validation
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');
const { 
  validatePetQuery, 
  validatePetId,        // 🎯 NEW: Custom validation for YOUR pet ID format (p000, p032, etc.)
  validateFlexiblePetId  // Alternative: accepts both formats
} = require('../middleware/validation');

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

// GET /api/pets - Get all pets with query validation
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

// 🎯 GET /api/pets/:id - Get single pet by ID with PROPER CUSTOM VALIDATION
router.get('/:id', validatePetId, optionalAuth, async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🔍 Fetching pet with ID: ${petId} (validated: ${petId} matches p000 format)`);
    
    // At this point, petId is guaranteed to be in the correct format (p000, p032, etc.)
    // because it passed the validatePetId middleware
    
    const pet = await Pet.findById(petId)
      .populate('createdBy', 'name email')
      .populate('adoptedBy', 'name email');

    if (!pet) {
      console.log(`❌ Pet not found in database: ${petId}`);
      
      // For debugging: show what pets actually exist
      const samplePets = await Pet.find().limit(10).select('_id name type');
      console.log('📋 Available pets in database:', samplePets.map(p => ({ id: p._id, name: p.name })));
      
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        debug: process.env.NODE_ENV === 'development' ? {
          searchedId: petId,
          availablePets: samplePets.map(p => ({ id: p._id, name: p.name, type: p.type }))
        } : undefined
      });
    }

    // Increment view count
    try {
      pet.views = (pet.views || 0) + 1;
      await pet.save();
      console.log(`📈 Incremented view count for ${pet.name} to ${pet.views}`);
    } catch (saveError) {
      console.log('Failed to increment view count:', saveError.message);
      // Don't fail the request if we can't save the view count
    }

    console.log(`✅ Pet found: ${pet.name} (${pet.type}) - ID: ${pet._id}`);
    
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format for database query',
        debug: process.env.NODE_ENV === 'development' ? {
          providedId: req.params.id,
          errorType: 'CastError',
          suggestion: 'Pet ID should be in p000 format (p001, p032, etc.)'
        } : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 🎯 POST /api/pets/:id/vote - Vote on a pet with PROPER CUSTOM VALIDATION
router.post('/:id/vote', protect, validatePetId, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    
    console.log(`🗳️ Vote attempt for pet ${petId} with vote type: ${voteType}`);
    
    // Validate vote type
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    // Pet ID is already validated by validatePetId middleware
    const pet = await Pet.findById(petId);
    
    if (!pet) {
      console.log(`❌ Pet not found for voting: ${petId}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on unavailable pets',
        petStatus: pet.status
      });
    }

    // Initialize votes object if it doesn't exist
    if (!pet.votes || typeof pet.votes !== 'object') {
      pet.votes = { up: 0, down: 0 };
    }

    // Check if user already voted (simple check by user ID)
    const userVotes = pet.userVotes || [];
    const existingVoteIndex = userVotes.findIndex(vote => 
      vote.userId.toString() === req.user._id.toString()
    );
    
    if (existingVoteIndex !== -1) {
      // User has voted before
      const existingVote = userVotes[existingVoteIndex];
      
      // Remove the old vote count
      if (existingVote.voteType === 'up') {
        pet.votes.up = Math.max(0, pet.votes.up - 1);
      } else {
        pet.votes.down = Math.max(0, pet.votes.down - 1);
      }
      
      // If same vote type, remove the vote entirely; if different, update it
      if (existingVote.voteType === voteType) {
        // Same vote type - remove the vote
        pet.userVotes.splice(existingVoteIndex, 1);
        console.log(`🗳️ Removed ${voteType} vote from ${pet.name} by user ${req.user._id}`);
      } else {
        // Different vote type - update the vote
        pet.votes[voteType] += 1;
        existingVote.voteType = voteType;
        existingVote.votedAt = new Date();
        console.log(`🗳️ Changed vote to ${voteType} for ${pet.name} by user ${req.user._id}`);
      }
    } else {
      // New vote
      pet.votes[voteType] += 1;
      if (!pet.userVotes) pet.userVotes = [];
      pet.userVotes.push({
        userId: req.user._id,
        voteType,
        votedAt: new Date()
      });
      console.log(`🗳️ New ${voteType} vote for ${pet.name} by user ${req.user._id}`);
    }
    
    await pet.save();

    res.json({
      success: true,
      data: {
        votes: pet.votes,
        userVote: existingVoteIndex !== -1 && pet.userVotes[existingVoteIndex] 
          ? pet.userVotes[existingVoteIndex].voteType 
          : (existingVoteIndex === -1 ? voteType : null),
        totalVotes: (pet.votes.up || 0) + (pet.votes.down || 0)
      },
      message: `Vote processed successfully for ${pet.name}`
    });
    
  } catch (error) {
    console.error('Error voting on pet:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format for voting',
        debug: process.env.NODE_ENV === 'development' ? {
          providedId: req.params.id,
          errorType: 'CastError'
        } : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing vote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 🎯 GET /api/pets/:id/votes - Get vote statistics for a pet (optional endpoint)
router.get('/:id/votes', validatePetId, async (req, res) => {
  try {
    const petId = req.params.id;
    
    const pet = await Pet.findById(petId).select('name votes userVotes');
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const votes = pet.votes || { up: 0, down: 0 };
    const totalVotes = votes.up + votes.down;
    const upPercentage = totalVotes > 0 ? Math.round((votes.up / totalVotes) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        petId: pet._id,
        petName: pet.name,
        votes: votes,
        totalVotes: totalVotes,
        upPercentage: upPercentage,
        downPercentage: 100 - upPercentage,
        recentVotes: pet.userVotes ? pet.userVotes.slice(-10) : [] // Last 10 votes
      }
    });
    
  } catch (error) {
    console.error('Error fetching vote statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vote statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;