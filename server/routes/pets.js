// server/routes/pets.js
const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { optionalAuth, protect, admin } = require('../middleware/auth');

const router = express.Router();

// Constants for image URL construction
const GCS_BASE_URL = 'https://storage.googleapis.com/furbabies-petstore';

// ==== Helpers ====

/**
 * Enrich pet with computed image URLs
 * Backend provides both the path and full URL for flexibility
 */
const enrichPetResponse = (petDoc) => {
  const pet = petDoc?.toObject ? petDoc.toObject() : petDoc;

  return {
    ...pet,
    imagePath: pet.image || pet.imagePath || null, // original relative path from DB
    imageUrl: pet.image ? `${GCS_BASE_URL}/${pet.image}` : pet.imageUrl || null, // absolute URL
    fallbackType: pet.type || 'pet',
  };
};

const buildSearchQuery = (queryParams) => {
  const {
    type,
    breed,
    age,
    category,
    available,
    gender,
    size,
    search,
    featured,
  } = queryParams;

  const query = {};

  if (type && type !== 'all') query.type = type;
  if (category && category !== 'all') query.category = category;
  if (gender && gender !== 'all') query.gender = gender;
  if (size && size !== 'all') query.size = size;
  if (featured === 'true') query.featured = true;

  if (typeof available !== 'undefined') {
    query.available = String(available) === 'true';
  }

  if (breed) {
    query.breed = { $regex: breed, $options: 'i' };
  }

  if (age) {
    query.age = { $regex: age, $options: 'i' };
  }

  if (search) {
    const s = String(search).trim();
    if (s) {
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { type: { $regex: s, $options: 'i' } },
        { breed: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
      ];
    }
  }

  return query;
};

const buildSort = (sortParam) => {
  switch (sortParam) {
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'name_asc':
      return { name: 1 };
    case 'name_desc':
      return { name: -1 };
    default:
      // Featured first, then newest
      return { featured: -1, createdAt: -1 };
  }
};

// ===== ROUTES =====

// @route   GET /api/pets
// @desc    Get all pets with optional filters, pagination, and image enrichment
// @access  Public (auth optional for personalization later)
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // Filters & sort
    const query = buildSearchQuery(req.query);
    const sort = buildSort(req.query.sort);

    const [total, pets] = await Promise.all([
      Pet.countDocuments(query),
      Pet.find(query).sort(sort).limit(limit).skip(skip),
    ]);

    const enrichedPets = pets.map(enrichPetResponse);

    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/pets error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/pets/featured
// @desc    Get featured pets, default limit 4 for homepage sections
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 24);
    const pets = await Pet.find({ featured: true, available: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    const data = pets.map(enrichPetResponse);

    res.json({ success: true, data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/pets/featured error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/pets/:id
// @desc    Get single pet by ID (ObjectId or string ID field)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let pet = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      pet = await Pet.findById(id);
    }

    // If not found by ObjectId, try a string-based lookup (e.g., slug)
    if (!pet) {
      pet = await Pet.findOne({ _id: id }).catch(() => null);
    }

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    return res.json({ success: true, data: enrichPetResponse(pet) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/pets/:id error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// (Optional) Admin create/update/delete endpoints can be added below with protect/admin middleware

module.exports = router;
