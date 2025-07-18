// server/routes/pets.js - ROBUST FIX with better error handling
const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// ⭐ ROBUST: Pet ID validation with better error handling
const validatePetId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Pet ID is required',
      error: 'MISSING_ID'
    });
  }

  // Accept both MongoDB ObjectIds AND custom pet IDs
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isCustomPetId = /^p\d{3}$/.test(id);
  
  if (!isValidObjectId && !isCustomPetId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pet ID format',
      error: 'INVALID_ID_FORMAT',
      received: id,
      expected: 'Either a MongoDB ObjectId (24 chars) or custom pet ID (p001, p003, etc.)',
      examples: ['p001', 'p003', 'p025', '507f1f77bcf86cd799439011']
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

    const query = { status: 'available' };

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
      query.featured = true;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
        { type: searchRegex }
      ];
    }

    if (req.query.age && req.query.age !== 'all') {
      const ageRegex = new RegExp(req.query.age, 'i');
      query.age = ageRegex;
    }

    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }

    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

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
      default:
        sortObj = { createdAt: -1 };
    }

    const total = await Pet.countDocuments(query);
    const pets = await Pet.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

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

// ⭐ ROBUST: Get single pet by ID with comprehensive error handling
router.get('/:id', validatePetId, async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    let pet;
    
    try {
      // ✅ ROBUST: Try direct query first - this should work with your custom string IDs
      pet = await Pet.findOne({ _id: req.params.id }).lean();
    } catch (queryError) {
      console.log('⚠️ Direct query failed, trying alternative approach:', queryError.message);
      
      // ✅ FALLBACK: If direct query fails, try different approaches
      try {
        // Try treating as ObjectId if it's valid
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
          pet = await Pet.findById(req.params.id).lean();
        } else {
          // For custom IDs, try a more explicit query
          pet = await Pet.collection.findOne({ _id: req.params.id });
        }
      } catch (fallbackError) {
        console.error('❌ All query methods failed:', fallbackError.message);
        throw new Error(`Unable to query pet with ID: ${req.params.id}`);
      }
    }

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

    // ✅ Add computed fields
    const enrichedPet = {
      ...pet,
      imageUrl: pet.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: pet.createdAt ? 
        Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)) : 0
    };

    console.log('✅ Pet found:', pet.name, '(ID:', req.params.id + ')');

    res.json({
      success: true,
      data: enrichedPet,
      message: `Pet details for ${pet.name}`
    });

  } catch (error) {
    console.error('❌ Error fetching pet by ID:', error);
    
    // ✅ DETAILED: Provide detailed error information
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet details',
      error: error.message,
      petId: req.params.id,
      suggestion: 'This might be a temporary server issue. Please try again.',
      timestamp: new Date().toISOString(),
      // Include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// ⭐ ROBUST: Rate a pet with comprehensive error handling
router.post('/:id/rate', validatePetId, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        received: rating
      });
    }

    let pet;
    
    try {
      // ✅ ROBUST: Try the same approach as the get route
      pet = await Pet.findOne({ _id: req.params.id });
    } catch (queryError) {
      console.log('⚠️ Rating query failed, trying alternative:', queryError.message);
      
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        pet = await Pet.findById(req.params.id);
      } else {
        // For custom IDs, we need to update directly
        const result = await Pet.collection.findOneAndUpdate(
          { _id: req.params.id },
          { 
            $set: { 
              rating: rating,
              ratingCount: 1 // Simplified for now
            }
          },
          { returnDocument: 'after' }
        );
        
        if (result.value) {
          return res.json({
            success: true,
            message: `Thank you for rating this pet!`,
            data: {
              petId: req.params.id,
              newRating: rating,
              ratingCount: 1
            }
          });
        }
      }
    }

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        error: 'PET_NOT_FOUND'
      });
    }

    // Update rating for mongoose documents
    const currentRating = pet.rating || 0;
    const ratingCount = pet.ratingCount || 0;
    const newRatingCount = ratingCount + 1;
    const newRating = ((currentRating * ratingCount) + rating) / newRatingCount;

    pet.rating = Math.round(newRating * 10) / 10;
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
      error: error.message,
      petId: req.params.id
    });
  }
});

module.exports = router;