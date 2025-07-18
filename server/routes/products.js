// server/routes/products.js - FIXED to support custom product IDs
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

// ⭐ FIXED: Product ID validation for custom string IDs
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
  const isCustomProductId = /^prod\d{3}$/.test(id) || /^p\d{3}$/.test(id); // Supports prod001 or p001 format
  
  if (!isValidObjectId && !isCustomProductId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
      error: 'INVALID_ID_FORMAT',
      received: id,
      expected: 'Either a MongoDB ObjectId or custom product ID (prod001, p001, etc.)',
      examples: ['prod001', 'p001', '507f1f77bcf86cd799439011']
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

// ⭐ ENHANCED: Utility function to enrich product data
const addProductFields = (product) => ({
  ...product,
  displayName: product.name || 'Unnamed Product',
  imageUrl: product.image ? 
    `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
  fallbackImageUrl: '/api/images/fallback/product',
  priceDisplay: typeof product.price === 'number' ? 
    `$${product.price.toFixed(2)}` : 'Price not available',
  categoryDisplay: product.category || 'Uncategorized',
  inStockDisplay: product.inStock !== false ? 'In Stock' : 'Out of Stock',
  hasImage: !!product.image,
  isAvailable: product.inStock !== false
});

// ⭐ Get featured products
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured - Fetching featured products');
    
    const limit = parseInt(req.query.limit) || 4;
    
    const featuredProducts = await Product.aggregate([
      { 
        $match: { 
          featured: true, 
          inStock: { $ne: false }
        } 
      },
      { $sample: { size: limit } },
      {
        $addFields: {
          imageUrl: {
            $cond: {
              if: { $ne: ["$image", null] },
              then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
              else: null
            }
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Product"] },
          priceDisplay: { 
            $concat: ["$", { $toString: "$price" }]
          }
        }
      }
    ]);

    console.log(`🛒 Returning ${featuredProducts.length} featured products`);
    
    res.json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length
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

// ⭐ Get all products with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

    const query = { inStock: { $ne: false } }; // Only show in-stock products by default

    // Apply filters
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i');
    }

    if (req.query.featured === 'true') {
      query.featured = true;
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

    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }

    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }

    if (req.query.inStock === 'false') {
      query.inStock = false;
    } else if (req.query.inStock === 'true') {
      query.inStock = { $ne: false };
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

    // Enrich product data
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

// ⭐ MAIN FIX: Get single product by ID - handles custom IDs
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
      
      // Final fallback - direct collection query
      if (!product) {
        try {
          product = await Product.collection.findOne({ _id: req.params.id });
        } catch (collectionError) {
          console.error('❌ Collection query failed:', collectionError.message);
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

    // ✅ COMPREHENSIVE: Return ALL product data with enrichment
    const enrichedProduct = {
      // Core identification
      _id: product._id,
      name: product.name,
      
      // Categorization
      category: product.category,
      brand: product.brand,
      
      // Pricing and availability
      price: product.price,
      inStock: product.inStock,
      featured: product.featured,
      
      // Description and details
      description: product.description,
      
      // Images
      image: product.image,
      imageUrl: product.image ? 
        `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      imagePublicId: product.imagePublicId,
      hasImage: !!product.image,
      
      // Engagement metrics
      views: product.views || 0,
      
      // Creation info
      createdBy: product.createdBy,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Computed fields
      displayName: product.name || 'Unnamed Product',
      priceDisplay: typeof product.price === 'number' ? 
        `$${product.price.toFixed(2)}` : 'Price not available',
      categoryDisplay: product.category || 'Uncategorized',
      inStockDisplay: product.inStock !== false ? 'In Stock' : 'Out of Stock',
      isAvailable: product.inStock !== false,
      daysSincePosted: product.createdAt ? 
        Math.floor((new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)) : 0
    };

    // Increment views
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        await Product.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });
      } else {
        await Product.collection.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });
      }
    } catch (viewError) {
      console.log('⚠️ Could not increment views:', viewError.message);
    }

    console.log('✅ Product found and enriched:', product.name, '(ID:', req.params.id + ')');
    
    res.json({
      success: true,
      data: enrichedProduct,
      message: `Product details for ${product.name}`
    });

  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
      productId: req.params.id,
      suggestion: 'This might be a temporary server issue. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// ⭐ PROTECTED ROUTES (Admin only)
router.post('/', protect, admin, validateProductData, async (req, res) => {
  try {
    console.log('🛒 POST /products - Creating new product');
    
    const product = new Product({
      ...req.body,
      createdBy: req.user._id
    });
    await product.save();
    
    const enrichedProduct = addProductFields(product.toObject());
    
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

router.put('/:id', protect, admin, validateProductId, validateProductData, async (req, res) => {
  try {
    console.log('🛒 PUT /products/:id - Updating product:', req.params.id);
    
    let product;
    
    try {
      product = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { ...req.body, updatedBy: req.user._id },
        { new: true, runValidators: true }
      ).lean();
    } catch (updateError) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        product = await Product.findByIdAndUpdate(
          req.params.id,
          { ...req.body, updatedBy: req.user._id },
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

router.delete('/:id', protect, admin, validateProductId, async (req, res) => {
  try {
    console.log('🛒 DELETE /products/:id - Deleting product:', req.params.id);
    
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