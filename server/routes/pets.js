// server/routes/pets.js - COMPLETE UPDATED VERSION
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');

// ============================================
// GET ALL PETS WITH FILTERING
// ============================================

// GET /api/pets - Get all pets with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets called with query:', req.query);
    
    // ✅ FIXED: Build query properly - don't add default filters!
    let query = {};
    
    // Only add filters if they're explicitly requested
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    // ❌ DON'T add featured: false by default!
    
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }
    
    if (req.query.age && req.query.age !== 'all') {
      query.age = req.query.age;
    }
    
    // Handle search
    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { breed: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') }
      ];
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'name':
          sort = { name: 1 };
          break;
        case 'age':
          sort = { age: 1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }
    
    console.log('🐕 MongoDB Query:', query);
    console.log('🐕 Limit:', limit, 'Skip:', skip, 'Sort:', sort);
    
    // Get pets with query
    const pets = await Pet.find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    
    console.log(`🐕 Found ${pets.length} pets in database`);
    
    // ✅ CRITICAL: Add imageUrl to each pet
    const enrichedPets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available'
    }));
    
    // Get total count for pagination
    const total = await Pet.countDocuments(query);
    
    console.log('🐕 Sample enriched pet:', enrichedPets[0]);
    
    res.json({
      success: true,
      data: enrichedPets,
      count: enrichedPets.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + enrichedPets.length < total
      },
      filters: {
        applied: query,
        requested: req.query
      },
      message: `${enrichedPets.length} pets retrieved successfully`
    });
    
  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pets',
      error: error.message
    });
  }
});

// ============================================
// GET SINGLE PET BY ID
// ============================================

// GET /api/pets/:id - Get single pet by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id called with ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();
    
    if (!pet) {
      console.log('🐕 Pet not found');
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Add computed fields
    const enrichedPet = {
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    };

    // Increment view count if field exists
    if (pet.views !== undefined) {
      await Pet.findByIdAndUpdate(pet._id, { $inc: { views: 1 } });
      console.log('🐕 Incremented view count');
    }

    console.log('🐕 Pet found:', enrichedPet.displayName);

    res.json({ 
      success: true, 
      data: enrichedPet 
    });

  } catch (error) {
    console.error('❌ Error retrieving pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving pet', 
      error: error.message 
    });
  }
});

// ============================================
// ADMIN ROUTES (Protected - Add authentication middleware as needed)
// ============================================

// POST /api/pets - Create new pet (Admin only)
router.post('/', async (req, res) => {
  try {
    console.log('🐕 POST /api/pets - Creating new pet:', req.body.name);

    // Create pet with defaults and standardized fields
    const petData = {
      name: req.body.name,
      type: req.body.type,
      breed: req.body.breed,
      age: req.body.age || 'Unknown',
      size: req.body.size || 'medium',
      gender: req.body.gender || 'unknown',
      description: req.body.description,
      image: req.body.image || '',
      category: req.body.category || req.body.type, // Use type as default category
      status: req.body.status || 'available', // Always start as available
      featured: req.body.featured || false,
      location: req.body.location || '',
      createdAt: new Date(),
      views: 0
    };

    const pet = new Pet(petData);
    await pet.save();

    console.log('🐕 Pet created:', pet._id);

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: {
        ...pet.toObject(),
        imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
        hasImage: !!pet.image,
        displayName: pet.name,
        isAvailable: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pet',
      error: error.message
    });
  }
});

// PUT /api/pets/:id - Update pet (Admin only)
router.put('/:id', async (req, res) => {
  try {
    console.log('🐕 PUT /api/pets/:id - Updating pet:', req.params.id);

    const updateData = { ...req.body };
    updateData.updatedAt = new Date();

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    console.log('🐕 Pet updated successfully');

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: {
        ...pet.toObject(),
        imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
        hasImage: !!pet.image,
        displayName: pet.name,
        isAvailable: pet.status === 'available'
      }
    });

  } catch (error) {
    console.error('❌ Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pet',
      error: error.message
    });
  }
});

// DELETE /api/pets/:id - Delete pet (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log('🐕 DELETE /api/pets/:id - Deleting pet:', req.params.id);

    const pet = await Pet.findByIdAndDelete(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    console.log('🐕 Pet deleted successfully');

    res.json({
      success: true,
      message: 'Pet deleted successfully',
      data: {
        deletedId: req.params.id,
        deletedName: pet.name
      }
    });

  } catch (error) {
    console.error('❌ Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: error.message
    });
  }
});

module.exports = router;