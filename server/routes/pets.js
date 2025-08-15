// server/routes/pets.js
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { enrichEntityWithImages } = require('../utils/imageUtils');

/**
 * GET /api/pets
 * Query params: featured, limit, page, status, type, category
 */
router.get('/', async (req, res) => {
  try {
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
    
    // Handle featured filter
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [pets, totalCount] = await Promise.all([
      Pet.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Pet.countDocuments(query)
    ]);

    // Enrich with image URLs
    const enrichedPets = pets.map(pet => enrichEntityWithImages(pet, 'pet'));

    console.log(`✅ Returning ${enrichedPets.length} pets (query: ${JSON.stringify(query)})`);

    res.json({
      success: true,
      data: enrichedPets,
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

/**
 * GET /api/pets/featured
 * Legacy endpoint for backward compatibility
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured pets
    let pets = await Pet.find({ 
      status: 'available', 
      featured: true 
    })
    .sort('-createdAt')
    .limit(limit)
    .lean();

    // If not enough featured pets, fill with regular available pets
    if (pets.length < limit) {
      const additionalPets = await Pet.find({
        status: 'available',
        featured: { $ne: true },
        _id: { $nin: pets.map(p => p._id) }
      })
      .sort('-createdAt')
      .limit(limit - pets.length)
      .lean();
      
      pets = [...pets, ...additionalPets];
    }

    // Enrich with image URLs
    const enrichedPets = pets.map(pet => enrichEntityWithImages(pet, 'pet'));

    console.log(`✅ Returning ${enrichedPets.length} featured pets`);

    res.json({
      success: true,
      data: enrichedPets,
      count: enrichedPets.length
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

/**
 * GET /api/pets/:id
 * Get single pet by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).lean();
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Enrich with image URL
    const enrichedPet = enrichEntityWithImages(pet, 'pet');

    res.json({
      success: true,
      data: enrichedPet
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

module.exports = router;