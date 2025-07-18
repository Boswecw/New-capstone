// server/routes/pets.js - FIXED to support custom pet IDs like p001, p003, etc.
const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// ⭐ FIXED: Custom validation for your pet ID format
const validatePetId = (req, res, next) => {
  const { id } = req.params;
  
  // Check if ID is provided
  if (!id || id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Pet ID is required',
      error: 'MISSING_ID'
    });
  }

  // ✅ ACCEPT both MongoDB ObjectIds AND custom pet IDs (p001, p003, etc.)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isCustomPetId = /^p\d{3}$/.test(id); // Matches p001, p003, p025, etc.
  
  if (!isValidObjectId && !isCustomPetId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pet ID format',
      error: 'INVALID_ID_FORMAT',
      received: id,
      expected: 'Either a MongoDB ObjectId (24 chars) or custom pet ID (p001, p003, etc.)',
      examples: ['p001', 'p003', 'p025', '507f1f77bcf86cd799439011'],
      suggestion: 'Please use a valid pet ID from our browse page'
    });
  }

  console.log(`✅ Pet ID validation passed: ${id} (${isCustomPetId ? 'custom' : 'ObjectId'})`);
  next();
};

// ⭐ Get random featured pets for home page
router.get('/featured', async (req, res) => {
  try {
    console.log('🏠 GET /api/pets/featured - Random selection requested');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Use MongoDB aggregation for true random selection
    const featuredPets = await Pet.aggregate([
      { 
        $match: { 
          featured: true, 
          status: 'available' 
        } 
      },
      { $sample: { size: limit } },
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

// ⭐ Get all pets with advanced filtering and sorting
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = { status: 'available' };

    // Type filter (dog, cat, fish, bird, small-pet)
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Category filter (dog, cat, aquatic, other)
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Breed filter
    if (req.query.breed && req.query.breed !== 'all') {
      query.breed = new RegExp(req.query.breed, 'i');
    }

    // Featured filter
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

    // Age filter
    if (req.query.age && req.query.age !== 'all') {
      const ageRegex = new RegExp(req.query.age, 'i');
      query.age = ageRegex;
    }

    // Size filter
    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Sorting
    let sortObj = {};
    const sortOption = req.query.sort || 'newest';
    
    switch (sortOption) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
      case 'name_desc':
        sortObj = { name: -1 };
        break;
      case 'age_asc':
        sortObj = { age: 1 };
        break;
      case 'age_desc':
        sortObj = { age: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Execute query with pagination
    const total = await Pet.countDocuments(query);
    const pets = await Pet.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add computed fields to each pet
    const enrichedPets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    console.log(`🐕 Found ${pets.length} pets (Total: ${total})`);

    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + pets.length < total
      },
      filters: {
        type: req.query.type || 'all',
        breed: req.query.breed || 'all',
        category: req.query.category || 'all',
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

// ⭐ FIXED: Get single pet by ID - supports both ObjectIds and custom IDs
router.get('/:id', validatePetId, async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    // ✅ FIXED: Use findOne instead of findById to support custom string IDs
    const pet = await Pet.findOne({ _id: req.params.id }).lean();

    if (!pet) {
      console.log('🐕 Pet not found for ID:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found',
        error: 'PET_NOT_FOUND',
        petId: req.params.id,
        suggestion: 'This pet may have been adopted or is no longer available',
        helpUrl: '/api/pets'
      });
    }

    // Add computed fields
    const enrichedPet = {
      ...pet,
      imageUrl: pet.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    };

    console.log('✅ Pet found:', pet.name, '(ID:', req.params.id + ')');

    res.json({
      success: true,
      data: enrichedPet,
      message: `Pet details for ${pet.name}`
    });

  } catch (error) {
    console.error('❌ Error fetching pet by ID:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet details',
      error: error.message,
      petId: req.params.id
    });
  }
});

// ⭐ FIXED: Rate a pet with custom ID support
router.post('/:id/rate', validatePetId, async (req, res) => {
  try {
    const { rating } = req.body;
    
    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        received: rating
      });
    }

    // ✅ FIXED: Use findOne instead of findById for custom IDs
    const pet = await Pet.findOne({ _id: req.params.id });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        error: 'PET_NOT_FOUND'
      });
    }

    // Update rating (simple average for now)
    const currentRating = pet.rating || 0;
    const ratingCount = pet.ratingCount || 0;
    const newRatingCount = ratingCount + 1;
    const newRating = ((currentRating * ratingCount) + rating) / newRatingCount;

    pet.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
    pet.ratingCount = newRatingCount;
    
    await pet.save();

    console.log(`✅ Pet ${pet.name} (${pet._id}) rated: ${rating} (new average: ${pet.rating})`);

    res.json({
      success: true,
      message: `Thank you for rating ${pet.name}!`,
      data: {
        petId: pet._id,
        newRating: pet.rating,
        ratingCount: pet.ratingCount
      }
    });

  } catch (error) {
    console.error('❌ Error rating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate pet',
      error: error.message
    });
  }
});

module.exports = router;