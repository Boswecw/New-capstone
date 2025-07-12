const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, admin: adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.search) {
      filters.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category) {
      filters.category = req.query.category;
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.available !== '') {
      filters.available = req.query.available === 'true';
    }

    const total = await Pet.countDocuments(filters);
    const pets = await Pet.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: pets,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin pet fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pets' });
  }
});

module.exports = router;
