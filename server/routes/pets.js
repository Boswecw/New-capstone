// server/routes/pets.js - COMPLETE FIXED VERSION
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
      
      console.log(`✅ Found ${featuredPets.length} random featured pets`);
      return res.json({ success: true, data: featuredPets });
    }

    // Build query object
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filtering
    if (category) {
      query.category = category;
    }

    // Type filtering
    if (type) {
      query.type = type;
    }

    // Age filtering
    if (age) {
      query.age = age;
    }

    // Size filtering
    if (size) {
      query.size = size;
    }

    // Gender filtering
    if (gender) {
      query.gender = gender;
    }

    // Availability filtering
    if (available !== undefined) {
      query.available = available === 'true';
    }

    // Status filtering
    if (status) {
      query.status = status;
    }

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
      case 'name': 
        sortOptions.name = 1; 
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

// GET /api/pets/:id - Get single pet by ID ⭐ FIXED: THIS WAS MISSING!
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🔍 Fetching pet with ID: ${petId}`);
    
    // Basic ID validation - accept both MongoDB ObjectIds and custom strings
    if (!petId || petId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }
    
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
    pet.views = (pet.views || 0) + 1;
    await pet.save();

    console.log(`✅ Pet found: ${pet.name} (${pet.type})`);
    
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
        message: 'Invalid pet ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message
    });
  }
});

// POST /api/pets/:id/vote - Vote on a pet (requires authentication)
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    
    // Basic ID validation
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

    // Check if user already voted (simple check by user ID)
    const userVotes = pet.userVotes || [];
    const existingVote = userVotes.find(vote => vote.userId.toString() === req.user._id.toString());
    
    if (existingVote) {
      // Remove old vote
      if (existingVote.voteType === 'up') {
        pet.votes.up = Math.max(0, pet.votes.up - 1);
      } else {
        pet.votes.down = Math.max(0, pet.votes.down - 1);
      }
      
      // Add new vote if different
      if (existingVote.voteType !== voteType) {
        pet.votes[voteType] += 1;
        existingVote.voteType = voteType;
      } else {
        // Remove vote entirely if same type
        pet.userVotes = userVotes.filter(vote => vote.userId.toString() !== req.user._id.toString());
      }
    } else {
      // Add new vote
      pet.votes[voteType] += 1;
      if (!pet.userVotes) pet.userVotes = [];
      pet.userVotes.push({
        userId: req.user._id,
        voteType,
        votedAt: new Date()
      });
    }

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
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing vote',
      error: error.message
    });
  }
});

module.exports = router;