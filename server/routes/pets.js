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
      limit = 12,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    if (featured === 'true') {
      const featuredPets = await Pet.aggregate([
        { $sample: { size: parseInt(limit) } }
      ]);
      return res.json({
        success: true,
        data: featuredPets,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalPets: featuredPets.length,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Normal filtered pet list
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (type) query.type = type;
    if (age) query.age = { $lte: parseInt(age) };
    if (size) query.size = size;
    if (gender) query.gender = gender;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const sortOptions = {};
    switch (sort) {
      case 'name': sortOptions.name = 1; break;
      case 'age': sortOptions.age = 1; break;
      case 'newest': sortOptions.createdAt = -1; break;
      case 'oldest': sortOptions.createdAt = 1; break;
      default: sortOptions.createdAt = -1;
    }

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean();

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
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pets:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching pets', error: error.message });
  }
});

module.exports = router;
