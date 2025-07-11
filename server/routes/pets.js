// server/routes/pets.js - FIXED TO HANDLE STRING IDS LIKE "p040"
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// @desc    Get all pets with optional filters
// @route   GET /api/pets
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);
    
    const query = {};

    // Build query based on filters
    if (req.query.type) query.type = req.query.type;
    if (req.query.breed) query.breed = { $regex: req.query.breed, $options: 'i' };
    if (req.query.age) query.age = { $regex: req.query.age, $options: 'i' };
    if (req.query.category) query.category = req.query.category;
    if (req.query.available !== undefined) query.available = req.query.available === 'true';
    
    // Search functionality
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: regex },
        { breed: regex },
        { description: regex },
        { type: regex }
      ];
    }

    // Featured pets filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    console.log('🐕 Built query:', query);

    const pets = await Pet.find(query).sort({ createdAt: -1 });
    
    console.log(`🐕 Found ${pets.length} pets`);
    
    res.json({ 
      success: true, 
      data: pets, 
      count: pets.length,
      query: req.query 
    });
    
  } catch (err) {
    console.error('❌ Error fetching pets:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// @desc    Get pet by ID (ENHANCED - handles both ObjectId and string IDs)
// @route   GET /api/pets/:id
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🐕 GET /api/pets/${petId} - Attempting to find pet`);
    
    let pet = null;
    const searchMethods = [];

    // Method 1: Try direct _id match (works for both ObjectId and string)
    try {
      console.log(`🔍 Method 1: Direct _id lookup for "${petId}"`);
      pet = await Pet.findOne({ _id: petId });
      searchMethods.push({ method: 'direct_id', success: !!pet, id: petId });
      if (pet) {
        console.log(`✅ Found pet via direct _id: ${pet.name}`);
        return res.json({ success: true, data: pet, searchMethod: 'direct_id' });
      }
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
      searchMethods.push({ method: 'direct_id', success: false, error: error.message });
    }

    // Method 2: Try as MongoDB ObjectId (if it looks like one)
    if (mongoose.Types.ObjectId.isValid(petId) && petId.length === 24) {
      try {
        console.log(`🔍 Method 2: ObjectId lookup for "${petId}"`);
        pet = await Pet.findById(petId);
        searchMethods.push({ method: 'objectid', success: !!pet, id: petId });
        if (pet) {
          console.log(`✅ Found pet via ObjectId: ${pet.name}`);
          return res.json({ success: true, data: pet, searchMethod: 'objectid' });
        }
      } catch (error) {
        console.log(`❌ Method 2 failed: ${error.message}`);
        searchMethods.push({ method: 'objectid', success: false, error: error.message });
      }
    }

    // Method 3: Try raw MongoDB collection search (bypasses Mongoose validation)
    try {
      console.log(`🔍 Method 3: Raw collection lookup for "${petId}"`);
      const collection = mongoose.connection.db.collection('pets');
      const rawResult = await collection.findOne({ _id: petId });
      searchMethods.push({ method: 'raw_collection', success: !!rawResult, id: petId });
      if (rawResult) {
        console.log(`✅ Found pet via raw collection: ${rawResult.name}`);
        return res.json({ success: true, data: rawResult, searchMethod: 'raw_collection' });
      }
    } catch (error) {
      console.log(`❌ Method 3 failed: ${error.message}`);
      searchMethods.push({ method: 'raw_collection', success: false, error: error.message });
    }

    // Method 4: Search by name pattern (e.g., "p040" -> "Pet 040")
    if (petId.startsWith('p')) {
      try {
        const nameNumber = petId.substring(1); // Remove 'p' prefix
        const searchName = `Pet ${nameNumber}`;
        console.log(`🔍 Method 4: Name search for "${searchName}"`);
        pet = await Pet.findOne({ name: { $regex: searchName, $options: 'i' } });
        searchMethods.push({ method: 'name_pattern', success: !!pet, searchName });
        if (pet) {
          console.log(`✅ Found pet via name pattern: ${pet.name}`);
          return res.json({ success: true, data: pet, searchMethod: 'name_pattern' });
        }
      } catch (error) {
        console.log(`❌ Method 4 failed: ${error.message}`);
        searchMethods.push({ method: 'name_pattern', success: false, error: error.message });
      }
    }

    // Method 5: Search by partial name match
    try {
      console.log(`🔍 Method 5: Partial name search for "${petId}"`);
      pet = await Pet.findOne({ name: { $regex: petId, $options: 'i' } });
      searchMethods.push({ method: 'partial_name', success: !!pet, searchTerm: petId });
      if (pet) {
        console.log(`✅ Found pet via partial name: ${pet.name}`);
        return res.json({ success: true, data: pet, searchMethod: 'partial_name' });
      }
    } catch (error) {
      console.log(`❌ Method 5 failed: ${error.message}`);
      searchMethods.push({ method: 'partial_name', success: false, error: error.message });
    }

    // Method 6: List all pets to see what IDs actually exist
    try {
      console.log(`🔍 Method 6: Listing all pet IDs for debugging`);
      const allPets = await Pet.find({}, { _id: 1, name: 1 }).limit(10);
      const petIds = allPets.map(p => ({ id: p._id, name: p.name }));
      console.log('📋 Available pet IDs:', petIds);
      searchMethods.push({ method: 'list_all', success: true, availableIds: petIds });
    } catch (error) {
      console.log(`❌ Method 6 failed: ${error.message}`);
      searchMethods.push({ method: 'list_all', success: false, error: error.message });
    }

    // No pet found with any method
    console.log(`❌ Pet not found with ID: ${petId}`);
    console.log('📊 Search methods tried:', searchMethods);

    return res.status(404).json({ 
      success: false, 
      message: 'Pet not found',
      petId: petId,
      searchMethods: searchMethods,
      suggestion: 'Check available pet IDs or try browsing all pets'
    });

  } catch (err) {
    console.error('❌ Error in pet lookup:', err);
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
    // Use the same enhanced search logic as the GET route
    let pet = await Pet.findOne({ _id: req.params.id });
    
    // Fallback to raw collection search if Mongoose fails
    if (!pet) {
      const collection = mongoose.connection.db.collection('pets');
      const rawResult = await collection.findOne({ _id: req.params.id });
      if (rawResult) {
        // Convert back to Mongoose document for saving
        pet = new Pet(rawResult);
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
    console.error('Error voting on pet:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Add rating to a pet
// @route   POST /api/pets/:id/rate
// @access  Protected
router.post('/:id/rate', protect, async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    // Use the same enhanced search logic
    let pet = await Pet.findOne({ _id: req.params.id });
    
    if (!pet) {
      const collection = mongoose.connection.db.collection('pets');
      const rawResult = await collection.findOne({ _id: req.params.id });
      if (rawResult) {
        pet = new Pet(rawResult);
      }
    }

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const newRating = {
      user: req.user._id,
      rating: rating,
      comment: comment || '',
      createdAt: new Date()
    };

    if (!pet.ratings) {
      pet.ratings = [];
    }

    pet.ratings.push(newRating);
    await pet.save();

    res.json({ success: true, data: pet, message: 'Rating added successfully' });
  } catch (err) {
    console.error('Error adding rating:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;