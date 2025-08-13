// server/routes/pets.js - ENHANCED WITH IMAGE ENRICHMENT

const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { addImageFields } = require('../utils/imageUtils');
const router = express.Router();

// Constants
const BUCKET = 'https://storage.googleapis.com/furbabies-petstore';

// ===== IMAGE ENRICHMENT UTILITIES =====

/**
 * Normalize image URL to absolute format
 */
const absolutizeImageUrl = (src) => {
  if (!src || typeof src !== 'string') return '';
  return /^https?:\/\//i.test(src) ? src : `/api/images/resolve?src=${encodeURIComponent(src)}`;
};

/**
 * Extract image from pet object - tries multiple field names
 */
const pickPetImage = (pet) => {
  const sources = [
    pet.imageUrl,
    pet.photoUrl,
    pet.image,
    Array.isArray(pet.images) ? (pet.images[0]?.url || pet.images[0]) : null,
    Array.isArray(pet.photos) ? (pet.photos[0]?.url || pet.photos[0]) : null,
    pet.media?.photos?.[0]?.full,
    pet.media?.photos?.[0]?.url,
    pet.media?.image,
    pet.imagePath,
    pet.image_key,
    pet.photo,
    pet.picture
  ];

  return sources.find(source => source && typeof source === 'string') || null;
};

/**
 * Type-specific fallback images
 */
const typeFallbacks = {
  dog: `${BUCKET}/placeholders/dog.png`,
  cat: `${BUCKET}/placeholders/cat.png`,
  bird: `${BUCKET}/placeholders/bird.png`,
  fish: `${BUCKET}/placeholders/fish.png`,
  rabbit: `${BUCKET}/placeholders/rabbit.png`,
  hamster: `${BUCKET}/placeholders/hamster.png`,
  'small-pet': `${BUCKET}/placeholders/small-pet.png`,
  aquatic: `${BUCKET}/placeholders/fish.png`,
  other: `${BUCKET}/placeholders/pet.png`,
  default: `${BUCKET}/placeholders/pet.png`
};

/**
 * Normalize image path to full URL
 */
const normalizeImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  // Already a full URL
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  
  // Relative path - clean and build full URL
  const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes
  return `${BUCKET}/${cleanPath}`;
};

/**
 * Enrich pet object with proper imageUrl
 */
const enrichPetWithImage = (pet) => {
  // Convert mongoose document to plain object if needed
  const petObj = pet.toObject ? pet.toObject() : pet;
  
  // Try to find an existing image
  const candidateImage = pickPetImage(petObj);
  
  // Always normalize to absolute URL, even if we have a candidate
  const absoluteImageUrl = candidateImage ? absolutizeImageUrl(candidateImage) : '';
  
  // Get type-specific fallback
  const typeKey = petObj.type?.toLowerCase?.();
  const fallbackUrl = typeFallbacks[typeKey] || typeFallbacks.default;
  
  // Use absolute URL or fallback
  const finalImageUrl = absoluteImageUrl || fallbackUrl;
  
  console.log('🖼️ Pet image enrichment:', {
    petName: petObj.name,
    petId: petObj._id,
    candidateImage,
    absoluteImageUrl,
    fallbackUrl,
    finalImageUrl
  });

  return {
    ...petObj,
    imageUrl: finalImageUrl,
    fallbackImageUrl: `/api/images/fallback/pet`,
    // Preserve original image field for reference
    originalImage: candidateImage
  };
};

// ===== ROUTES =====

/**
 * GET /api/pets - List pets with filters
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

    // Build query object
    const query = {};
    
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (size && size !== 'all') query.size = size;
    if (gender && gender !== 'all') query.gender = gender;
    
    // Featured filter
    if (featured && featured !== 'all') {
      query.featured = featured === 'true';
    }
    
    // Age filter (handle string ages like "6 months")
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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { personalityTraits: { $in: [new RegExp(search, 'i')] } }
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
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per request
    const skipNum = parseInt(skip) || ((parseInt(page) - 1) * limitNum);

    console.log('🔍 Pet query:', {
      query,
      sort: sortOption,
      limit: limitNum,
      skip: skipNum
    });

    // Execute query with performance tracking
    const startTime = Date.now();
    
    const [pets, totalCount] = await Promise.all([
      Pet.find(query)
        .sort(sortOption)
        .limit(limitNum)
        .skip(skipNum)
        .lean(), // Use lean() for better performance
      Pet.countDocuments(query)
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`⚡ Pet query completed in ${queryTime}ms`);

    // ✅ CRITICAL: Enrich all pets with proper image URLs
    const enrichedPets = pets.map(enrichPetWithImage);

    // ✅ IMPROVED: Calculate consistent pagination info 
    const totalPages = Math.ceil(totalCount / limitNum);
    const currentPage = Math.floor(skipNum / limitNum) + 1;
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // ✅ CRITICAL: Always return consistent pagination structure
    const paginationResponse = {
      totalCount,
      totalPages,
      currentPage,
      limit: limitNum,
      hasNextPage,
      hasPrevPage,
      queryTime: `${queryTime}ms`
    };

    res.json({
      success: true,
      data: enrichedPets,
      pagination: paginationResponse, // ✅ Always present
      total: totalCount, // ✅ Also include top-level total for compatibility
      filters: {
        type,
        status,
        category,
        size,
        age,
        gender,
        featured,
        search,
        sort
      }
    });

  } catch (error) {
    console.error('❌ Pet listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/pets/featured - Get featured pets
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6, type } = req.query;
    
    const query = {
      featured: true,
      status: 'available'
    };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    console.log('🌟 Featured pets query:', query);

    const pets = await Pet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // ✅ CRITICAL: Enrich featured pets with image URLs
    const enrichedPets = pets.map(enrichPetWithImage);

    // ✅ IMPROVED: Consistent response structure (even for featured)
    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        totalCount: enrichedPets.length,
        totalPages: 1,
        currentPage: 1,
        limit: parseInt(limit),
        hasNextPage: false,
        hasPrevPage: false
      },
      total: enrichedPets.length,
      count: enrichedPets.length // Legacy field
    });

  } catch (error) {
    console.error('❌ Featured pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured pets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        success: false,
        message: 'Invalid pet ID format'
      });
    }

    const pet = await Pet.findById(id).lean();

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // ✅ CRITICAL: Enrich single pet with image URL
    const enrichedPet = enrichPetWithImage(pet);

    // Increment view count (fire and forget)
    Pet.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(err => {
      console.warn('Failed to increment pet views:', err);
    });

    res.json({
      success: true,
      data: enrichedPet
    });

  } catch (error) {
    console.error('❌ Pet detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/pets - Create new pet
 */
router.post('/', async (req, res) => {
  try {
    // Create pet with data from request body
    const petData = { ...req.body };
    
    // Set default createdBy if not provided (should come from auth middleware)
    if (!petData.createdBy) {
      petData.createdBy = new mongoose.Types.ObjectId(); // Placeholder - replace with actual user ID from auth
    }

    const pet = new Pet(petData);
    const savedPet = await pet.save();

    // ✅ CRITICAL: Enrich new pet with image URL before returning
    const enrichedPet = enrichPetWithImage(savedPet);

    console.log('✅ Pet created:', enrichedPet._id, enrichedPet.name);

    res.status(201).json({
      success: true,
      data: enrichedPet,
      message: 'Pet created successfully'
    });

  } catch (error) {
    console.error('❌ Pet creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create pet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/pets/:id - Update pet
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format'
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.__v;

    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // ✅ CRITICAL: Enrich updated pet with image URL
    const enrichedPet = enrichPetWithImage(updatedPet);

    console.log('✅ Pet updated:', enrichedPet._id, enrichedPet.name);

    res.json({
      success: true,
      data: enrichedPet,
      message: 'Pet updated successfully'
    });

  } catch (error) {
    console.error('❌ Pet update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/pets/:id - Delete pet
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format'
      });
    }

    const deletedPet = await Pet.findByIdAndDelete(id);

    if (!deletedPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    console.log('✅ Pet deleted:', deletedPet._id, deletedPet.name);

    res.json({
      success: true,
      message: 'Pet deleted successfully',
      data: { id: deletedPet._id, name: deletedPet.name }
    });

  } catch (error) {
    console.error('❌ Pet deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/pets/stats/summary - Get pet statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const [
      totalPets,
      availablePets,
      adoptedPets,
      featuredPets,
      typeStats
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: 'available' }),
      Pet.countDocuments({ status: 'adopted' }),
      Pet.countDocuments({ featured: true }),
      Pet.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalPets,
        available: availablePets,
        adopted: adoptedPets,
        featured: featuredPets,
        byType: typeStats
      }
    });

  } catch (error) {
    console.error('❌ Pet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet statistics'
    });
  }
});

module.exports = router;