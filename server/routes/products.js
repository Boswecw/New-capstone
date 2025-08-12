// server/routes/products.js - FIXED VERSION (featured now boolean only)
const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// ✅ ADVANCED FILTER MAPPING for PRODUCTS
const mapProductFiltersToQuery = (filters) => {
  const query = { inStock: true }; // Only show in-stock products
  const orConditions = [];

  // ✅ FEATURED filtering - Boolean only now
  if (filters.featured === 'true' || filters.featured === true) {
    query.featured = true;
  }

  // ✅ CATEGORY mapping
  if (filters.category && filters.category !== 'all') {
    switch (filters.category.toLowerCase()) {
      case 'food':
        query.category = /dog care|cat care/i;
        query.name = /food|kibble/i;
        break;
      case 'toys':
        query.name = /toy/i;
        break;
      case 'accessories':
        query.category = /dog care|cat care/i;
        query.name = /harness|leash|collar|bed/i;
        break;
      case 'health':
        query.category = /grooming|health/i;
        break;
      case 'aquarium':
        query.category = /aquarium/i;
        break;
      default:
        query.category = new RegExp(filters.category, 'i');
    }
  }

  // ✅ BRAND filtering
  if (filters.brand && filters.brand !== 'all') {
    query.brand = new RegExp(filters.brand, 'i');
  }

  // ✅ PRICE RANGE filtering
  if (filters.priceRange && filters.priceRange !== 'all') {
    const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
    if (max) {
      query.price = { $gte: parseFloat(min), $lte: parseFloat(max) };
    } else {
      query.price = { $gte: parseFloat(min) };
    }
  }

  // ✅ SEARCH across multiple fields
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    orConditions.push([
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ]);
  }

  if (orConditions.length === 1) {
    query.$or = orConditions[0];
  } else if (orConditions.length > 1) {
    query.$and = orConditions.map(cond => ({ $or: cond }));
  }

  console.log('🛍️ Mapped product filters to query:', JSON.stringify(query, null, 2));
  return query;
};

// ⭐ Get featured products - DEDICATED endpoint
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🌟 GET /api/products/featured - Fetching ${limit} featured products`);

    const featuredProducts = await Product.find({
      featured: true,
      inStock: true
    })
    .limit(limit)
    .lean();

    console.log(`✅ Found ${featuredProducts.length} featured products`);

    const enrichedProducts = featuredProducts.map(product => ({
      ...product,
      imageUrl: product.image,
      priceDisplay: `$${parseFloat(product.price || 0).toFixed(2)}`
    }));

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: 'Featured products retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// ⭐ Get all products with ADVANCED filtering
router.get('/', async (req, res) => {
  try {
    console.log('🛍️ GET /api/products - Query params:', req.query);
    const query = mapProductFiltersToQuery(req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    let sortObj = {};
    switch (req.query.sort || 'name') {
      case 'name': sortObj = { name: 1 }; break;
      case 'name-desc': sortObj = { name: -1 }; break;
      case 'price': sortObj = { price: 1 }; break;
      case 'price-desc': sortObj = { price: -1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'featured': sortObj = { featured: -1, name: 1 }; break;
      default: sortObj = { name: 1 };
    }

    console.log('🔍 Final product MongoDB query:', JSON.stringify(query, null, 2));

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ Found ${products.length} products (Total: ${total})`);

    const enrichedProducts = products.map(product => ({
      ...product,
      imageUrl: product.image,
      hasImage: !!product.image,
      priceDisplay: `$${parseFloat(product.price || 0).toFixed(2)}`,
      isInStock: product.inStock === true
    }));

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// ⭐ Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🛍️ GET /api/products/${id}`);

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productWithImageUrl = {
      ...product,
      imageUrl: product.image,
      priceDisplay: `$${parseFloat(product.price || 0).toFixed(2)}`
    };

    res.json({
      success: true,
      data: productWithImageUrl
    });

  } catch (error) {
    console.error(`❌ Error fetching product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

module.exports = router;
