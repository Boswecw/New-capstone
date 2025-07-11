// server/routes/pets.js - FIXED VERSION: Handle Custom String IDs
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// @desc    Get all pets with optional filters
// @route   GET /api/pets
router.get('/', async (req, res) => {
  try {
    const query = {};

    // Handle query parameters
    if (req.query.type) query.type = req.query.type;
    if (req.query.breed) query.breed = { $regex: req.query.breed, $options: 'i' };
    if (req.query.age) query.age = { $regex: req.query.age, $options: 'i' };
    if (req.query.featured) query.featured = req.query.featured === 'true';
    
    // Handle search
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: regex },
        { breed: regex },
        { description: regex }
      ];
    }

    // Handle limit
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    console.log('🔍 Pet query:', query, 'limit:', limit);
    
    let petsQuery = Pet.find(query);
    if (limit) {
      petsQuery = petsQuery.limit(limit);
    }
    
    const pets = await petsQuery;
    console.log('✅ Found pets:', pets.length);
    
    res.json({ success: true, data: pets, count: pets.length });
  } catch (err) {
    console.error('❌ Error fetching pets:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// @desc    Get featured pets (randomly selected like products)
// @route   GET /api/pets/featured
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    console.log('🎲 Randomly selecting featured pets, limit:', limit);
    
    // ✅ Use MongoDB aggregation to randomly sample pets (same as products)
    let featuredPets;
    try {
      featuredPets = await Pet.aggregate([
        { $sample: { size: limit } }
      ]);
      console.log('✅ Found random featured pets:', featuredPets.length);
    } catch (aggregateError) {
      console.warn('⚠️ Pet aggregation failed, using fallback:', aggregateError.message);
      // Fallback to regular find if aggregation fails
      featuredPets = await Pet.find({}).limit(limit);
      console.log('✅ Found featured pets (fallback):', featuredPets.length);
    }
    
    res.json({ success: true, data: featuredPets });
  } catch (err) {
    console.error('❌ Error fetching featured pets:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// @desc    Get pet by ID (FIXED: supports custom string IDs like "p053")
// @route   GET /api/pets/:id
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log('🔍 Looking for pet with ID:', petId);
    
    let pet = null;
    
    // ✅ Method 1: Try direct query with the ID as-is (works for custom string IDs)
    try {
      pet = await Pet.findOne({ _id: petId });
      if (pet) {
        console.log('✅ Found pet with direct _id match:', pet.name);
      }
    } catch (directError) {
      console.log('⚠️ Direct _id query failed:', directError.message);
    }
    
    // ✅ Method 2: If no pet found and ID looks like ObjectId, try findById
    if (!pet && petId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        pet = await Pet.findById(petId);
        if (pet) {
          console.log('✅ Found pet with findById:', pet.name);
        }
      } catch (objectIdError) {
        console.log('⚠️ ObjectId query failed:', objectIdError.message);
      }
    }
    
    // ✅ Method 3: If still no pet, try searching by name (last resort)
    if (!pet) {
      try {
        pet = await Pet.findOne({ 
          name: { $regex: new RegExp(petId.replace(/[^a-zA-Z0-9]/g, ''), 'i') } 
        });
        if (pet) {
          console.log('✅ Found pet with name search:', pet.name);
        }
      } catch (nameError) {
        console.log('⚠️ Name search failed:', nameError.message);
      }
    }

    if (!pet) {
      console.log('❌ Pet not found with any method for ID:', petId);
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    console.log('✅ Successfully returning pet:', pet.name, 'with ID:', pet._id);
    res.json({ success: true, data: pet });
  } catch (err) {
    console.error('❌ Error fetching pet by ID:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message,
      petId: req.params.id 
    });
  }
});

// @desc    Vote for a pet (up or down)
// @route   POST /api/pets/:id/vote
// @access  Protected
router.post('/:id/vote', protect, async (req, res) => {
  const { voteType } = req.body;

  if (!['up', 'down'].includes(voteType)) {
    return res.status(400).json({ success: false, message: 'Invalid vote type' });
  }

  try {
    // ✅ Use the same flexible ID matching as the get route
    const petId = req.params.id;
    let pet = null;
    
    // Try multiple methods to find the pet
    try {
      pet = await Pet.findOne({ _id: petId });
    } catch (directError) {
      if (petId.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          pet = await Pet.findById(petId);
        } catch (objectIdError) {
          console.log('Both ID methods failed for voting');
        }
      }
    }

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
    await pet.save();

    res.json({ success: true, data: pet });
  } catch (err) {
    console.error('❌ Error voting on pet:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;