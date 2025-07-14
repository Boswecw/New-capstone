// server/routes/products.js - FIXED VERSION WITH PROPER FILTERS
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// ============================================
// VALIDATION FUNCTIONS
// ============================================

// Validate MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid ID format" 
    });
  }
  next();
};

// ============================================
// FEATURED PRODUCTS ENDPOINT (Must come before /:id route)
// ============================================
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured');

    const limit = parseInt(req.query.limit) || 10;
    
    const featuredProducts = await Product.find({ 
      featured: true, 
      inStock: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Add computed fields
    const enrichedProducts = featuredProducts.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: `${product.price.toFixed(2)}`
    }));

    console.log(`🛒 Found ${enrichedProducts.length} featured products`);

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: `Found ${enrichedProducts.length} featured products`
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

// ============================================
// GET ALL PRODUCTS WITH ADVANCED FILTERING
// ============================================
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

    // Build query object
    const query = {};

    // ✅ FEATURED FILTER
    if (req.query.featured === "true") {
      query.featured = true;
      console.log('🛒 Filtering for featured products');
    }

    // ✅ IN STOCK FILTER - Handle both string and boolean values
    if (req.query.inStock !== undefined && req.query.inStock !== 'all') {
      query.inStock = req.query.inStock === "true" || req.query.inStock === true;
      console.log('🛒 Filtering by inStock:', query.inStock);
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = new RegExp(req.query.category, 'i'); // Case insensitive
      console.log('🛒 Filtering by category:', req.query.category);
    }

    // Brand filter
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i'); // Case insensitive
      console.log('🛒 Filtering by brand:', req.query.brand);
    }

    // Price range filtering
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
        console.log('🛒 Min price filter:', req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
        console.log('🛒 Max price filter:', req.query.maxPrice);
      }
    }

    // Text search across multiple fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ];
      console.log('🛒 Text search filter:', req.query.search);
    }

    // Image filter - Only include if explicitly requested
    if (req.query.withImage === "true") {
      query.image = { $exists: true, $nin: ["", null] };
      console.log('🛒 Filtering for products with images');
    }

    console.log('🛒 Built query:', JSON.stringify(query, null, 2));

    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    console.log('🛒 Pagination:', { limit, page, skip });

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
      case 'name': 
        sortOptions = { name: 1 }; 
        console.log('🛒 Sorting by name A-Z');
        break;
      case 'price-low': 
        sortOptions = { price: 1 }; 
        console.log('🛒 Sorting by price (low to high)');
        break;
      case 'price-high': 
        sortOptions = { price: -1 }; 
        console.log('🛒 Sorting by price (high to low)');
        break;
      case 'newest': 
        sortOptions = { createdAt: -1 }; 
        console.log('🛒 Sorting by newest first');
        break;
      case 'oldest': 
        sortOptions = { createdAt: 1 }; 
        console.log('🛒 Sorting by oldest first');
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        console.log('🛒 Sorting by featured first');
        break;
      default:
        console.log('🛒 Using default sort (newest first)');
    }

    // Execute query with error handling
    let products;
    let total;
    
    try {
      // Get total count for pagination
      total = await Product.countDocuments(query);
      
      // Get paginated products
      products = await Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean(); // Use lean() for better performance
        
      console.log(`🛒 Found ${products.length} products (Total: ${total})`);
      
      // Log first few products for debugging
      if (products.length > 0) {
        console.log('🛒 Sample products:', products.slice(0, 3).map(p => ({ 
          id: p._id, 
          name: p.name, 
          featured: p.featured, 
          inStock: p.inStock,
          price: p.price
        })));
      }
      
    } catch (dbError) {
      console.error('🛒 Database error:', dbError);
      throw dbError;
    }

    // Add computed fields to each product
    products = products.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: `$${product.price.toFixed(2)}`
    }));

    // Return success response
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + products.length < total
      },
      filters: {
        featured: req.query.featured || 'false',
        category: req.query.category || 'all',
        brand: req.query.brand || 'all',
        inStock: req.query.inStock || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest'
      },
      message: `Found ${products.length} products matching your criteria`
    });

  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
});

// ============================================
// GET SINGLE PRODUCT BY ID
// ============================================
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    console.log('🛒 GET /products/:id - Product ID:', req.params.id);
    
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      console.log('🛒 Product not found');
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Add computed fields
    const enrichedProduct = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: `$${product.price.toFixed(2)}`
    };

    console.log('🛒 Product found:', enrichedProduct.displayName);
    
    res.json({
      success: true,
      data: enrichedProduct
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });
  }
});

// ============================================
// FEATURED PRODUCTS ENDPOINT (Alternative route)
// ============================================
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured');

    const limit = parseInt(req.query.limit) || 10;
    
    const featuredProducts = await Product.find({ 
      featured: true, 
      inStock: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Add computed fields
    const enrichedProducts = featuredProducts.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: `$${product.price.toFixed(2)}`
    }));

    console.log(`🛒 Found ${enrichedProducts.length} featured products`);

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: `Found ${enrichedProducts.length} featured products`
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

module.exports = router;