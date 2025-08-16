// server/routes/pets.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');

// Simple function to add image URLs - NO EXTERNAL DEPENDENCIES
const addImageUrl = (entity, entityType = 'pet') => {
  if (!entity) return entity;
  
  const baseUrl = 'https://storage.googleapis.com/furbabies-petstore';
  
  return {
    ...entity,
    imageUrl: entity.image ? `${baseUrl}/${entity.image}` : null,
    hasImage: !!entity.image
  };
};

// GET /api/pets - Get all pets with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    const {
      featured,
      limit = 20,
      page = 1,
      status = 'available',
      type,
      category,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [pets, totalCount] = await Promise.all([
      Pet.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Pet.countDocuments(query)
    ]);

    // ✅ FIXED: Add image URLs without missing function
    const petsWithImages = pets.map(pet => addImageUrl(pet, 'pet'));

    console.log(`✅ Returning ${petsWithImages.length} pets`);

    res.json({
      success: true,
      data: petsWithImages,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// GET /api/pets/featured - Featured pets endpoint
router.get('/featured', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured pets
    let pets = await Pet.find({ 
      status: 'available', 
      featured: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Fill with regular pets if not enough featured ones
    if (pets.length < limit) {
      const additionalPets = await Pet.find({
        status: 'available',
        featured: { $ne: true },
        _id: { $nin: pets.map(p => p._id) }
      })
      .sort({ createdAt: -1 })
      .limit(limit - pets.length)
      .lean();
      
      pets = [...pets, ...additionalPets];
    }

    // ✅ FIXED: Add image URLs without missing function
    const petsWithImages = pets.map(pet => addImageUrl(pet, 'pet'));

    console.log(`✅ Returning ${petsWithImages.length} featured pets`);

    res.json({
      success: true,
      data: petsWithImages,
      count: petsWithImages.length
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

// GET /api/pets/:id - Get single pet
router.get('/:id', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // ✅ FIXED: Add image URL without missing function
    const petWithImage = addImageUrl(pet, 'pet');

    res.json({
      success: true,
      data: petWithImage
    });

  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// POST /api/pets/:id/rate - Rate a pet
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { heartRating: rating },
      { new: true }
    ).lean();

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const petWithImage = addImageUrl(pet, 'pet');

    res.json({
      success: true,
      message: 'Pet rated successfully',
      data: petWithImage
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