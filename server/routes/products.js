// server/routes/products.js - FIXED for actual product data structure

const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// ✅ ADVANCED FILTER MAPPING for PRODUCTS (handles actual data structure)
const mapProductFiltersToQuery = (filters) => {
  const query = { inStock: true }; // Only show in-stock products

  // ✅ CATEGORY mapping - Map frontend values to actual database values
  if (filters.category && filters.category !== 'all') {
    switch (filters.category.toLowerCase()) {
      case 'food':
        query.category = new RegExp('(dog care|cat care)', 'i'); // Food is in Dog/Cat Care
        query.name = new RegExp('(food|kibble)', 'i'); // AND name contains food
        break;
      case 'toys':
        query.name = new RegExp('toy', 'i'); // Any product with "toy" in name
        break;
      case 'accessories':
        query.category = new RegExp('(dog care|cat care)', 'i');
        query.name = new RegExp('(harness|leash|collar|bed)', 'i');
        break;
      case 'health':
        query.category = new RegExp('(grooming|health)', 'i');
        break;
      case 'aquarium':
        query.category = new RegExp('aquarium', 'i');
        break;
      default:
        // Direct category match as fallback
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

  // ✅ FEATURED filtering - Handle string "true" from database
  if (filters.featured === 'true' || filters.featured === true) {
    query.$or = [
      { featured: true },
      { featured: "true" } // Handle string version from your data
    ];
  }

  // ✅ SEARCH across multiple fields
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ];
  }

  console.log('🛍️ Mapped product filters to query:', JSON.stringify(query, null, 2));
  return query;
};

// ⭐ Get featured products with string "true" handling
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    console.log(`🌟 GET /api/products/featured - Fetching ${limit} featured products`);
    
    // ✅ Handle both boolean and string "true"
    const featuredProducts = await Product.find({
      $or: [
        { featured: true },
        { featured: "true" }
      ],
      inStock: true
    })
    .limit(limit)
    .lean();
    
    console.log(`✅ Found ${featuredProducts.length} featured products`);
    
    // Add imageUrl for frontend compatibility
    const enrichedProducts = featuredProducts.map(product => ({
      ...product,
      imageUrl: product.image,
      priceDisplay: `$${parseFloat(product.price).toFixed(2)}`
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

    // ✅ USE ADVANCED MAPPING
    const query = mapProductFiltersToQuery(req.query);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    // Sorting
    let sortObj = {};
    switch (req.query.sort || 'name') {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'name-desc':
        sortObj = { name: -1 };
        break;
      case 'price':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'featured':
        sortObj = { featured: -1, name: 1 };
        break;
      default:
        sortObj = { name: 1 };
    }

    console.log('🔍 Final product MongoDB query:', JSON.stringify(query, null, 2));

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ Found ${products.length} products (Total: ${total})`);
    console.log(`📊 Sample product categories:`, products.slice(0, 3).map(p => p.category));

    // Enrich product data
    const enrichedProducts = products.map(product => ({
      ...product,
      imageUrl: product.image, // Keep as-is
      hasImage: !!product.image,
      priceDisplay: `$${parseFloat(product.price).toFixed(2)}`,
      isInStock: product.inStock === true || product.inStock === "true"
    }));

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      },
      debug: {
        appliedFilters: req.query,
        mongoQuery: query,
        resultCategories: [...new Set(products.map(p => p.category))]
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
    
    // Add imageUrl for frontend compatibility
    const productWithImageUrl = {
      ...product,
      imageUrl: product.image,
      priceDisplay: `$${parseFloat(product.price).toFixed(2)}`
    };
    
    console.log(`✅ Found product: ${product.name}`);
    
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