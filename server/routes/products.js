// server/routes/products.js - COMPLETE UPDATED VERSION - Emergency Fix for Featured Products
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

// ===== VALIDATION MIDDLEWARE =====

// Product ID validation for custom string IDs  
const validateProductId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required',
      error: 'MISSING_ID'
    });
  }

  // Accept both MongoDB ObjectIds AND custom product IDs
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isCustomProductId = /^prod_\d{3}$/.test(id); // Matches prod_002, prod_004, etc.
  
  if (!isValidObjectId && !isCustomProductId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
      error: 'INVALID_ID_FORMAT',
      received: id,
      expected: 'Either a MongoDB ObjectId or custom product ID (prod_001, prod_002, etc.)',
      examples: ['prod_004', 'prod_002', '507f1f77bcf86cd799439011']
    });
  }

  console.log(`✅ Product ID validation passed: ${id} (${isCustomProductId ? 'custom' : 'ObjectId'})`);
  next();
};

const validateProductData = (req, res, next) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, price, and category are required" 
    });
  }
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Price must be a valid positive number" 
    });
  }
  next();
};

// ===== UTILITY FUNCTIONS =====

// Helper function to determine if value is "truthy" (handles strings and booleans)
const isTruthy = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return !!value;
};

// Utility function to enrich product data (matches pets pattern)
const addProductFields = (product) => ({
  ...product,
  displayName: product.name || 'Unnamed Product',
  imageUrl: product.image ? 
    `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
  fallbackImageUrl: '/api/images/fallback/product',
  priceDisplay: typeof product.price === 'number' ? 
    `$${product.price.toFixed(2)}` : 'Price not available',
  categoryDisplay: product.category || 'Uncategorized',
  inStockDisplay: (product.inStock !== false && product.inStock !== "false") ? 'In Stock' : 'Out of Stock',
  hasImage: !!product.image,
  isAvailable: (product.inStock !== false && product.inStock !== "false"),
  // Convert featured to boolean if it's a string
  featured: isTruthy(product.featured),
  // Convert inStock to boolean if it's a string  
  inStock: isTruthy(product.inStock)
});

// ===== DEBUG ENDPOINT =====

// 🔍 DEBUG: Test endpoint to check product data structure
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking product data structure...');
    
    // Get first few products to examine
    const products = await Product.find({}).limit(3).lean();
    
    const debugInfo = {
      totalProducts: await Product.countDocuments(),
      sampleProducts: products,
      featuredProducts: await Product.find({
        $or: [
          { featured: true },
          { featured: "true" },
          { featured: 1 }
        ]
      }).limit(2).lean(),
      dataTypes: products.map(p => ({
        _id: p._id,
        name: p.name,
        featured: {
          value: p.featured,
          type: typeof p.featured
        },
        inStock: {
          value: p.inStock,
          type: typeof p.inStock
        }
      }))
    };
    
    console.log('🔍 Debug info generated');
    
    res.json({
      success: true,
      debug: debugInfo,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== PUBLIC ROUTES =====

// ⭐ EMERGENCY FIX: Get featured products - simplified approach
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured - Fetching featured products (Emergency Fix)');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Simple query without aggregation - works with string "true"
    const products = await Product.find({
      $or: [
        { featured: true },
        { featured: "true" },
        { featured: 1 }
      ]
    }).limit(limit).lean();

    console.log(`🛒 Raw products found: ${products.length}`);
    if (products.length > 0) {
      console.log(`🛒 First product featured value: ${products[0].featured} (type: ${typeof products[0].featured})`);
    }

    // Manual data enrichment to match pets format
    const enrichedProducts = products.map(product => ({
      _id: product._id,
      name: product.name || 'Unnamed Product',
      category: product.category || 'Uncategorized',
      brand: product.brand || 'Generic',
      price: product.price || 0,
      description: product.description || '',
      image: product.image || null,
      
      // Generate consistent image URL (same as pets)
      imageUrl: product.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      
      // Convert string booleans to actual booleans
      featured: isTruthy(product.featured),
      inStock: isTruthy(product.inStock),
      
      // Display helpers (same as pets)
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      priceDisplay: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'Price not available',
      categoryDisplay: product.category || 'Uncategorized',
      inStockDisplay: isTruthy(product.inStock) ? 'In Stock' : 'Out of Stock',
      isAvailable: isTruthy(product.inStock),
      
      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Optional fields
      views: product.views || 0,
      createdBy: product.createdBy
    }));

    console.log(`🛒 Returning ${enrichedProducts.length} featured products`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: `Found ${enrichedProducts.length} featured products`
    });

  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    console.error('❌ Full error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ⭐ Get all products with filtering (same pattern as pets)
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

    const query = {}; // Start with empty query

    // Apply filters (handle string and boolean values)
    if (req.query.category && req.query.category !== 'all') {
      query.category = new RegExp(req.query.category, 'i');
    }

    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i');
    }

    if (req.query.featured === 'true' || req.query.featured === true) {
      query.$or = [
        { featured: true },
        { featured: "true" },
        { featured: 1 }
      ];
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    // Price filtering
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }

    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }

    // Stock filtering - handle both string and boolean values
    if (req.query.inStock === 'false') {
      query.$or = [
        { inStock: false },
        { inStock: "false" }
      ];
    } else if (req.query.inStock !== undefined) {
      // Default to showing in-stock items
      query.$or = [
        { inStock: true },
        { inStock: "true" },
        { inStock: { $ne: false } },
        { inStock: { $ne: "false" } },
        { inStock: { $exists: false } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Sorting
    let sortObj = {};
    switch (req.query.sort || 'newest') {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
      case 'name_desc':
        sortObj = { name: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich product data with consistent fields
    const enrichedProducts = products.map(addProductFields);

    console.log(`🛒 Found ${products.length} products (Total: ${total})`);

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + products.length < total
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

// ⭐ Get single product by ID - handles custom IDs
router.get('/:id', validateProductId, async (req, res) => {
  try {
    console.log('🛒 GET /api/products/:id - Product ID:', req.params.id);
    
    let product;
    
    try {
      // Try findOne first for custom string IDs
      product = await Product.findOne({ _id: req.params.id }).lean();
    } catch (queryError) {
      console.log('⚠️ findOne failed, trying findById:', queryError.message);
      
      // Fallback to findById for ObjectIds
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        try {
          product = await Product.findById(req.params.id).lean();
        } catch (findByIdError) {
          console.error('❌ findById also failed:', findByIdError.message);
        }
      }
    }

    if (!product) {
      console.log('🛒 Product not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: 'PRODUCT_NOT_FOUND',
        productId: req.params.id,
        suggestion: 'This product may no longer be available'
      });
    }

    // Increment view count
    try {
      await Product.updateOne(
        { _id: req.params.id },
        { $inc: { views: 1 } }
      );
    } catch (viewError) {
      console.log('⚠️ Could not increment view count:', viewError.message);
    }

    // Return enriched product data
    const enrichedProduct = addProductFields(product);

    console.log('✅ Product found and returned:', product.name);
    
    res.json({
      success: true,
      data: enrichedProduct
    });

  } catch (error) {
    console.error('❌ Error fetching product by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
      suggestion: 'Please try again later'
    });
  }
});

// ===== PROTECTED ROUTES (Admin only) =====

// Create new product
router.post('/', protect, admin, validateProductData, async (req, res) => {
  try {
    console.log('🛒 POST /api/products - Creating new product');
    
    const product = new Product({
      ...req.body,
      createdBy: req.user._id,
      // Ensure boolean fields are properly set
      featured: isTruthy(req.body.featured) || false,
      inStock: req.body.inStock !== undefined ? isTruthy(req.body.inStock) : true
    });
    
    await product.save();
    
    const enrichedProduct = addProductFields(product.toObject());
    
    console.log('✅ Product created successfully:', product._id);
    
    res.status(201).json({
      success: true,
      data: enrichedProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update product
router.put('/:id', protect, admin, validateProductId, validateProductData, async (req, res) => {
  try {
    console.log('🛒 PUT /api/products/:id - Updating product:', req.params.id);
    
    // Ensure boolean fields are properly converted
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    if (updateData.featured !== undefined) {
      updateData.featured = isTruthy(updateData.featured);
    }
    
    if (updateData.inStock !== undefined) {
      updateData.inStock = isTruthy(updateData.inStock);
    }
    
    let product;
    
    try {
      product = await Product.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (updateError) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        product = await Product.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).lean();
      }
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const enrichedProduct = addProductFields(product);
    
    console.log('✅ Product updated successfully');
    
    res.json({
      success: true,
      data: enrichedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/:id', protect, admin, validateProductId, async (req, res) => {
  try {
    console.log('🛒 DELETE /api/products/:id - Deleting product:', req.params.id);
    
    let product;
    
    try {
      product = await Product.findOneAndDelete({ _id: req.params.id });
    } catch (deleteError) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        product = await Product.findByIdAndDelete(req.params.id);
      }
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('✅ Product deleted successfully');
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

module.exports = router;