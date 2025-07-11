// server/routes/pets.js
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, optionalAuth } = require('../middleware/auth');

// @desc    Get all pets with optional filters
// @route   GET /api/pets
router.get('/', async (req, res) => {
  try {
    const query = {};

    if (req.query.type) query.type = req.query.type;
    if (req.query.breed) query.breed = { $regex: req.query.breed, $options: 'i' };
    if (req.query.age) query.age = { $regex: req.query.age, $options: 'i' };
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: regex },
        { breed: regex },
        { description: regex }
      ];
    }

    const pets = await Pet.find(query);
    res.json({ success: true, data: pets, count: pets.length });
  } catch (err) {
    console.error('Error fetching pets:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get featured pets (random selection)
// @route   GET /api/pets/featured
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featuredPets = await Pet.aggregate([
      { $match: { featured: true } },
      { $sample: { size: limit } }
    ]);
    res.json({ success: true, data: featuredPets });
  } catch (err) {
    console.error('Error fetching featured pets:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get pet by ID (supports string _id like "p001")
// @route   GET /api/pets/:id
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id });

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    res.json({ success: true, data: pet });
  } catch (err) {
    console.error('Error fetching pet by ID:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const pet = await Pet.findOne({ _id: req.params.id });

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

module.exports = router;
