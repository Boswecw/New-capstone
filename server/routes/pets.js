// server/routes/pets.js - UPDATED WITH FIXED IMAGE HANDLING

const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { getImageUrl, addImageFields } = require('../utils/imageUtils');
const router = express.Router();

// Constants
const BUCKET_BASE = 'https://storage.googleapis.com/furbabies-petstore';

// ===== IMAGE UTILITIES =====

/**
 * Extract image from pet object - tries multiple field names
 */
const extractPetImage = (pet) => {
  const sources = [
    pet.imageUrl,
    pet.image,
    pet.photoUrl,
    pet.photo,
    pet.picture,
    Array.isArray(pet.images) ? pet.images[0]?.url || pet.images[0] : null,
    Array.isArray(pet.photos) ? pet.photos[0]?.url || pet.photos[0] : null,
    pet.media?.photos?.[0]?.full,
    pet.media?.photos?.[0]?.url,
    pet.media?.image,
    pet.imagePath,
    pet.image_key
  ];

  return sources.find(source => source && typeof source === 'string') || null;
};

/**
 * Type-specific fallback images
 */
const getTypeFallback = (type) => {
  const fallbacks = {
    dog: `${BUCKET_BASE}/placeholders/dog.png`,
    cat: `${BUCKET_BASE}/placeholders/cat.png`,
    bird: `${BUCKET_BASE}/placeholders/bird.png`,
    fish: `${BUCKET_BASE}/placeholders/fish.png`,
    aquatic: `${BUCKET_BASE}/placeholders/fish.png`,
    rabbit: `${BUCKET_BASE}/placeholders/rabbit.png`,
    hamster: `${BUCKET_BASE}/placeholders/hamster.png`,
    'small-pet': `${BUCKET_BASE}/placeholders/small-pet.png`,
    other: `${BUCKET_BASE}/placeholders/pet.png`,
    default: `${BUCKET_BASE}/placeholders/pet.png`
  };

  const typeKey = (type || 'default').toLowerCase();
  return fallbacks[typeKey] || fallbacks.default;
};

/**
 * Enrich pet object with proper imageUrl using fixed image utilities
 */
const enrichPetWithImage = (pet) => {
  // Convert mongoose document to plain object if needed
  const petObj = pet.toObject ? pet.toObject() : pet;
  
  // Extract candidate image
  const candidateImage = extractPetImage(petObj);
  
  // ✅ FIXED: Use server imageUtils with no URL encoding
  const resolvedImageUrl = getImageUrl(candidateImage);
  
  // Get type-specific fallback
  const fallbackUrl = getTypeFallback(petObj.type);
  
  // Use resolved URL or fallback
  const finalImageUrl = resolvedImageUrl || fallbackUrl;
  
  console.log('🖼️ Pet image enrichment:', {
    petName: petObj.name,
    petId: petObj._id,
    petType: petObj.type,
    candidateImage,
    resolvedImageUrl,
    fallbackUrl,
    finalImageUrl
  });

  return {
    ...petObj,
    imageUrl: finalImageUrl,
    fallbackImageUrl: `/api/images/fallback/pet`,
    originalImagePath: candidateImage // Keep for debugging
  };
};

// ===== ROUTES =====

/**
 * GET /api/pets - List pets with filters and search
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      status = 'available',
      category,
      size,
      age,
      gender,
      featured,
      search,
      sort = 'newest',
      limit = 20,
      skip = 0,
      page = 1
    } = req.query;

    console.log('🔍 Pet search request:', { 
      type, status, category, size, age, gender, featured, search, sort, limit 
    });

    // Build query object
    const query = {};
    
    // Type filter
    if (type && type !== 'all') {
      query.type = new RegExp(type, 'i');
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Category filter (for pets that have categories)
    if (category && category !== 'all') {
      query.category = new RegExp(category, 'i');
    }
    
    // Size filter
    if (size && size !== 'all') {
      query.size = new RegExp(size, 'i');
    }
    
    // Gender filter
    if (gender && gender !== 'all') {
      query.gender = new RegExp(gender, 'i');
    }
    
    // Featured filter (handle both boolean and string)
    if (featured && featured !== 'all') {
      query.featured = featured === 'true' || featured === true;
    }
    
    // Age filter (flexible matching for various age formats)
    if (age && age !== 'all') {
      if (age === 'young') {
        query.age = { $regex: /(puppy|kitten|young|months?)/, $options: 'i' };
      } else if (age === 'adult') {
        query.age = { $regex: /(adult|year)/, $options: 'i' };
      } else if (age === 'senior') {
        query.age = { $regex: /(senior|old)/, $options: 'i' };
      } else {
        query.age = { $regex: age, $options: 'i' };
      }
    }

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
        { type: searchRegex },
        { personalityTraits: { $in: [searchRegex] } },
        { specialNeeds: { $in: [searchRegex] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'type':
        sortOption = { type: 1, name: 1 };
        break;
      case 'featured':
        sortOption = { featured: -1, createdAt: -1 };
        break;
      case 'hearts':
        sortOption = { hearts: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 items per request
    const skipNum = parseInt(skip) || ((parseInt(page) - 1) * limitNum);

    console.log('📊 Query details:', {
      query: JSON.stringify(query),
      sort: sortOption,
      limit: limitNum,
      skip: skipNum
    });

    // Execute query with pagination
    const [pets, totalCount] = await Promise.all([
      Pet.find(query)
        .sort(sortOption)
        .limit(limitNum)
        .skip(skipNum)
        .lean(), // Use lean() for better performance
      Pet.countDocuments(query)
    ]);

    console.log(`✅ Found ${pets.length} pets (${totalCount} total)`);

    // Enrich pets with proper image URLs
    const enrichedPets = pets.map(enrichPetWithImage);

    // Response with pagination metadata
    res.json({
      pets: enrichedPets,
      pagination: {
        total: totalCount,
        page: parseInt(page) || 1,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: skipNum + limitNum < totalCount,
        hasPrev: skipNum > 0
      },
      filters: {
        applied: { type, status, category, size, age, gender, featured, search },
        total: Object.keys(query).length
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /pets:', error);
    res.status(500).json({
      error: 'Failed to fetch pets',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/pets/:id - Get single pet by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid pet ID format',
        message: 'Pet ID must be a valid MongoDB ObjectId'
      });
    }

    console.log(`🔍 Fetching pet details for ID: ${id}`);

    const pet = await Pet.findById(id).lean();

    if (!pet) {
      console.log(`❌ Pet not found: ${id}`);
      return res.status(404).json({ 
        error: 'Pet not found',
        message: `No pet found with ID: ${id}`
      });
    }

    console.log(`✅ Found pet: ${pet.name} (${pet.type})`);

    // Enrich with proper image URL
    const enrichedPet = enrichPetWithImage(pet);

    res.json(enrichedPet);

  } catch (error) {
    console.error(`❌ Error fetching pet ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to fetch pet details',
      message: error.message,
      petId: req.params.id
    });
  }
});

/**
 * POST /api/pets/:id/rate - Rate a pet (heart system)
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid pet ID format' 
      });
    }

    console.log(`❤️ Rating pet: ${id}`);

    // Find and update pet hearts count
    const pet = await Pet.findByIdAndUpdate(
      id,
      { $inc: { hearts: 1 } },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({ 
        error: 'Pet not found' 
      });
    }

    console.log(`✅ Pet ${pet.name} now has ${pet.hearts} hearts`);

    res.json({
      success: true,
      hearts: pet.hearts,
      petId: id,
      petName: pet.name
    });

  } catch (error) {
    console.error(`❌ Error rating pet ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to rate pet',
      message: error.message
    });
  }
});

/**
 * GET /api/pets/featured - Get featured pets
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    console.log(`🌟 Fetching ${limit} featured pets`);

    const featuredPets = await Pet.find({ 
      featured: true, 
      status: 'available' 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    console.log(`✅ Found ${featuredPets.length} featured pets`);

    // Enrich with proper image URLs
    const enrichedPets = featuredPets.map(enrichPetWithImage);

    res.json({
      pets: enrichedPets,
      count: enrichedPets.length
    });

  } catch (error) {
    console.error('❌ Error fetching featured pets:', error);
    res.status(500).json({
      error: 'Failed to fetch featured pets',
      message: error.message
    });
  }
});

/**
 * GET /api/pets/stats - Get pet statistics
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Generating pet statistics');

    const [
      totalPets,
      availablePets,
      adoptedPets,
      typeStats,
      featuredPets
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: 'available' }),
      Pet.countDocuments({ status: 'adopted' }),
      Pet.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Pet.countDocuments({ featured: true })
    ]);

    const stats = {
      overview: {
        total: totalPets,
        available: availablePets,
        adopted: adoptedPets,
        featured: featuredPets
      },
      byType: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      adoptionRate: totalPets > 0 ? ((adoptedPets / totalPets) * 100).toFixed(1) : 0
    };

    console.log('✅ Pet statistics generated:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Error generating pet stats:', error);
    res.status(500).json({
      error: 'Failed to generate pet statistics',
      message: error.message
    });
  }
});

module.exports = router;