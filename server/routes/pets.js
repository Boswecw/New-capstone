// server/routes/pets.js
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');

const GCS_BASE_URL =
  process.env.GCS_BASE_URL || 'https://storage.googleapis.com/furbabies-petstore';

// Build a full image URL from a stored path like "pet/black-gold-fish.png"
function buildImageUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleaned = String(path).replace(/^\/+/, '').replace(/^images\//, '');
  return `${GCS_BASE_URL}/${cleaned}`;
}

// Add derived image fields without mutating the original mongo doc
function enrichPet(doc) {
  const p = doc && typeof doc.toObject === 'function' ? doc.toObject() : (doc || {});
  const imagePath = p.image || p.imagePath || null;
  return {
    ...p,
    imagePath,
    imageUrl: buildImageUrl(imagePath),
  };
}

/**
 * GET /api/pets
 * Supports filters + pagination:
 *  - search (name/breed/description)
 *  - type, size, gender, age, status
 *  - featured=true
 *  - available=true  // maps to adopted !== true
 *  - page, limit, sort(newest|oldest|name|type|featured)
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      type,
      size,
      gender,
      age,
      status,
      featured,
      available,
      page = 1,
      limit = 12,
      sort = 'newest',
    } = req.query;

    const query = {};

    if (search) {
      const re = new RegExp(String(search), 'i');
      query.$or = [{ name: re }, { breed: re }, { description: re }];
    }
    if (type && type !== 'all') query.type = type;
    if (size && size !== 'all') query.size = size;
    if (gender && gender !== 'all') query.gender = gender;
    if (age && age !== 'all') query.age = age;
    if (status && status !== 'all') query.status = status;
    if (String(featured) === 'true') query.featured = true;
    if (String(available) === 'true') query.adopted = { $ne: true };

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      type: { type: 1, name: 1 },
      featured: { featured: -1, createdAt: -1 },
    };
    const sortOptions = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skipNum = (pageNum - 1) * limitNum;

    const [rows, total] = await Promise.all([
      Pet.find(query).sort(sortOptions).skip(skipNum).limit(limitNum),
      Pet.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rows.map(enrichPet),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
      totalResults: total,
    });
  } catch (err) {
    console.error('GET /pets error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * GET /api/pets/featured
 * Optional pretty route for legacy clients.
 */
router.get('/featured', async (req, res) => {
  try {
    const limitNum = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 6));
    const rows = await Pet.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limitNum);
    res.json({ success: true, data: rows.map(enrichPet) });
  } catch (err) {
    console.error('GET /pets/featured error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * GET /api/pets/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: enrichPet(pet) });
  } catch (err) {
    console.error('GET /pets/:id error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
