const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePetQuery, validateObjectId } = require('../middleware/validation');

// GET /api/pets - Get all pets with filtering and pagination
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
      limit = 12,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Build query object
    const query = { status: 'available' };

    // Add filters
    if (category && category !== 'all') {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (age) {
      query.age = { $lte: parseInt(age) };
    }

    if (size) {
      query.size = size;
    }

    if (gender) {
      query.gender = gender;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'age':
        sortOptions.age = 1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Execute query
    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Pets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// GET /api/pets/featured - Get featured pets
router.get('/featured', async (req, res) => {
  try {
    const featuredPets = await Pet.find({
      status: 'available',
      featured: true
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: featuredPets,
      message: 'Featured pets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// GET /api/pets/stats - Get pet statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          availablePets: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          adoptedPets: {
            $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] }
          },
          pendingPets: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Pet.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalPets: 0,
          availablePets: 0,
          adoptedPets: 0,
          pendingPets: 0
        },
        categories: categoryStats
      },
      message: 'Pet statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet statistics',
      error: error.message
    });
  }
});

// GET /api/pets/:id - Get single pet by ID
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('createdBy', 'name email profile.phone')
      .populate('adoptedBy', 'name email');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Increment view count
    await pet.incrementViews();

    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// POST /api/pets/:id/favorite - Add pet to favorites (requires auth)
router.post('/:id/favorite', protect, validateObjectId, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Add to user's favorites
    await req.user.addToFavorites(pet._id);

    // Increment pet's favorite count
    pet.favorites += 1;
    await pet.save();

    res.json({
      success: true,
      message: 'Pet added to favorites'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
});

// DELETE /api/pets/:id/favorite - Remove pet from favorites (requires auth)
router.delete('/:id/favorite', protect, validateObjectId, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Remove from user's favorites
    await req.user.removeFromFavorites(pet._id);

    // Decrement pet's favorite count
    pet.favorites = Math.max(0, pet.favorites - 1);
    await pet.save();

    res.json({
      success: true,
      message: 'Pet removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
});

// GET /api/pets/:id/similar - Get similar pets
router.get('/:id/similar', validateObjectId, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Find similar pets based on type, category, and age
    const similarPets = await Pet.find({
      _id: { $ne: pet._id },
      status: 'available',
      $or: [
        { type: pet.type },
        { category: pet.category },
        { age: { $gte: pet.age - 2, $lte: pet.age + 2 } }
      ]
    })
      .limit(6)
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: similarPets,
      message: 'Similar pets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching similar pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching similar pets',
      error: error.message
    });
  }
});

module.exports = router;