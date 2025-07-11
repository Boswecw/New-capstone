// server/routes/pets.js - Updated with ObjectId validation and fallback search
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// GET /api/pets/featured - Get random featured pets
router.get('/featured', async (req, res) => {
  try {
    console.log('🌟 Fetching random featured pets...');
    const { limit = 6 } = req.query;

    const featuredPets = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $sample: { size: parseInt(limit) } }
    ]);

    console.log(`✅ Found ${featuredPets.length} random featured pets`);
    res.json({ success: true, data: featuredPets });
  } catch (error) {
    console.error('❌ Error fetching featured pets:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching featured pets', error: error.message });
  }
});

// GET /api/pets - List pets (supports filtering)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filter = { status: 'available' };
    const { type, featured, limit = 50 } = req.query;

    if (type) filter.type = type;
    if (featured) filter.featured = featured === 'true';

    const pets = await Pet.find(filter).limit(parseInt(limit)).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: pets,
      count: pets.length
    });
  } catch (error) {
    console.error('❌ Error fetching pets:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/pets/:id - Get single pet by ID (with fallback search)
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🎯 Fetching pet with ID: ${petId}`);

    let pet = null;

    if (mongoose.Types.ObjectId.isValid(petId)) {
      try {
        pet = await Pet.findById(petId);
        if (pet) console.log(`🎯 Found via findById: ${pet.name}`);
      } catch (err) {
        console.log(`❌ findById failed: ${err.message}`);
      }
    }

    if (!pet) {
      try {
        const raw = await mongoose.connection.db.collection('pets').findOne({ _id: petId });
        if (raw) {
          pet = new Pet(raw);
          console.log(`🎯 Found via raw collection fallback: ${pet.name}`);
        }
      } catch (err) {
        console.log(`❌ Raw fallback failed: ${err.message}`);
      }
    }

    if (!pet) {
      const fallback = await Pet.find().limit(20).select('_id name type');
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
        searchedId: petId,
        availablePets: fallback.map(p => ({ id: p._id, name: p.name, type: p.type }))
      });
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('❌ Error fetching pet details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message,
      requestedId: req.params.id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/pets/:id/vote - Upvote/downvote a pet
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;

    console.log(`🗳️ Voting: ${voteType} for pet ${petId}`);

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ success: false, message: 'Invalid vote type. Must be "up" or "down"' });
    }

    let pet = null;

    if (mongoose.Types.ObjectId.isValid(petId)) {
      try {
        pet = await Pet.findById(petId);
      } catch (err) {
        console.log(`🗳️ findById failed: ${err.message}`);
      }
    }

    if (!pet) {
      try {
        const raw = await mongoose.connection.db.collection('pets').findOne({ _id: petId });
        if (raw) pet = new Pet(raw);
      } catch (err) {
        console.log(`🗳️ Raw fallback failed: ${err.message}`);
      }
    }

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found for voting' });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Cannot vote on unavailable pets' });
    }

    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    pet.votes[voteType] = (pet.votes[voteType] || 0) + 1;
    await pet.save();

    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('❌ Error voting on pet:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error voting on pet',
      error: error.message
    });
  }
});

module.exports = router;
