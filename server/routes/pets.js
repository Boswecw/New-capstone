// server/routes/pets.js - COMPLETE FIX - Returns all pet data properly
const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// ⭐ Pet ID validation for custom string IDs
const validatePetId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Pet ID is required',
      error: 'MISSING_ID'
    });
  }

  // Accept both MongoDB ObjectIds AND custom pet IDs (p001, p003, etc.)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isCustomPetId = /^p\d{3}$/.test(id);
  
  if (!isValidObjectId && !isCustomPetId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pet ID format',
      error: 'INVALID_ID_FORMAT',
      received: id,
      expected: 'Either a MongoDB ObjectId (24 chars) or custom pet ID (p001, p003, etc.)',
      examples: ['p001', 'p003', 'p025', 'p054']
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
      count: featuredPets.length
    });

  } catch (error) {
    console.error('❌ Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// ⭐ Get all pets with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    const query = { status: 'available' };

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

    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }

    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Sorting
    let sortObj = {};
    switch (req.query.sort || 'newest') {
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

    // ✅ Enrich pet data with computed fields
    const enrichedPets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available'
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

// ⭐ MAIN FIX: Get single pet by ID - returns ALL pet data
router.get('/:id', validatePetId, async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    let pet;
    
    try {
      // ✅ Try findOne first for custom string IDs
      pet = await Pet.findOne({ _id: req.params.id }).lean();
    } catch (queryError) {
      console.log('⚠️ findOne failed, trying findById:', queryError.message);
      
      // ✅ Fallback to findById for ObjectIds
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        try {
          pet = await Pet.findById(req.params.id).lean();
        } catch (findByIdError) {
          console.error('❌ findById also failed:', findByIdError.message);
        }
      }
      
      // ✅ Final fallback - direct collection query
      if (!pet) {
        try {
          pet = await Pet.collection.findOne({ _id: req.params.id });
        } catch (collectionError) {
          console.error('❌ Collection query failed:', collectionError.message);
        }
      }
    }

    if (!pet) {
      console.log('🐕 Pet not found for ID:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found',
        error: 'PET_NOT_FOUND',
        petId: req.params.id,
        suggestion: 'This pet may have been adopted or is no longer available'
      });
    }

    // ✅ COMPREHENSIVE: Return ALL pet data with proper enrichment
    const enrichedPet = {
      // Core identification
      _id: pet._id,
      name: pet.name,
      
      // Type and categorization
      type: pet.type,
      category: pet.category,
      breed: pet.breed,
      
      // Physical characteristics
      age: pet.age,
      gender: pet.gender,
      size: pet.size,
      color: pet.color,
      
      // Description and personality
      description: pet.description,
      personalityTraits: pet.personalityTraits || [],
      
      // Images
      image: pet.image,
      imageUrl: pet.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      imagePublicId: pet.imagePublicId,
      additionalImages: pet.additionalImages || [],
      hasImage: !!pet.image,
      
      // Status and availability
      status: pet.status,
      featured: pet.featured,
      isAvailable: pet.status === 'available',
      
      // Health and care info
      healthInfo: pet.healthInfo || {},
      
      // Adoption details
      adoptionFee: pet.adoptionFee || 0,
      
      // Location info
      location: pet.location || {},
      
      // Contact information
      contactInfo: pet.contactInfo || {},
      
      // Engagement metrics
      views: pet.views || 0,
      favorites: pet.favorites || 0,
      rating: pet.rating || 0,
      ratingCount: pet.ratingCount || 0,
      
      // Adoption tracking
      adoptedBy: pet.adoptedBy,
      adoptedAt: pet.adoptedAt,
      
      // Creation info
      createdBy: pet.createdBy,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
      
      // Computed fields
      displayName: pet.name || 'Unnamed Pet',
      daysSincePosted: pet.createdAt ? 
        Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
      
      // Age formatting
      ageInWords: pet.age || 'Age unknown'
    };

    console.log('✅ Pet found and enriched:', pet.name, '(ID:', req.params.id + ')');
    console.log('📊 Pet data fields:', Object.keys(enrichedPet).length);

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
      petId: req.params.id,
      suggestion: 'This might be a temporary server issue. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// ⭐ Rate a pet
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
      pet = await Pet.findOne({ _id: req.params.id });
    } catch (queryError) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        pet = await Pet.findById(req.params.id);
      }
    }

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        error: 'PET_NOT_FOUND'
      });
    }

    // Update rating
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
      error: error.message
    });
  }
});

module.exports = router;