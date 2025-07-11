// server/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @desc    Get all products (optional filters can be added later)
// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featuredProducts = await Product.find({ featured: true }).limit(limit);
    res.json({ success: true, data: featuredProducts });
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get a single product by ID (supports custom string _id like 'prod_006')
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
