// server/routes/products.js - FIXED VERSION - Resolves MongoDB aggregation error

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

// ===== VALIDATION FUNCTIONS =====
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  next();
};

const validateProductData = (req, res, next) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: "Name, price, and category are required" });
  }
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ success: false, message: "Price must be a valid positive number" });
  }
  next();
};

// ===== UTILITY FUNCTIONS =====
const addProductFields = (product) => ({
  ...product,
  displayName: product.name || 'Unnamed Product',
  imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
  fallbackImageUrl: '/api/images/fallback/product',
  priceDisplay: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'Price not available',
  categoryDisplay: product.category || 'Uncategorized',
  inStockDisplay: product.inStock !== false ? 'In Stock' : 'Out of Stock'
});

// ============================================
// FEATURED PRODUCTS ROUTE - FIXED VERSION
// ============================================
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    console.log(`🛒 GET /api/products/featured - Limit: ${limit}`);

    // ✅ FIXED: Simple aggregation without problematic $addFields
    const featuredProducts = await Product.aggregate([
      { $match: { inStock: true } },
      { $sample: { size: limit } }
    ]);

    // ✅ FIXED: Add fields using JavaScript instead of MongoDB aggregation
    const enrichedProducts = featuredProducts.map(addProductFields);

    console.log(`🛒 Returning ${enrichedProducts.length} random featured products`);
    
    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      message: `${enrichedProducts.length} featured products selected randomly`
    });

  } catch (error) {
    console.error('❌ Error fetching random featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// ============================================
// METADATA ROUTES (Must come before /:id route)
// ============================================

// @desc Get product categories
router.get("/meta/categories", async (req, res) => {
  try {
    console.log('🛒 GET /products/meta/categories');
    
    const categories = await Product.distinct("category");
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category });
        return { name: category, count };
      })
    );

    console.log('🛒 Found categories:', categoriesWithCount.length);
    
    res.json({
      success: true,
      data: categoriesWithCount.filter(cat => cat.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

// @desc Get product brands
router.get("/meta/brands", async (req, res) => {
  try {
    console.log('🛒 GET /products/meta/brands');
    
    const brands = await Product.distinct("brand");
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const count = await Product.countDocuments({ brand });
        return { name: brand, count };
      })
    );

    console.log('🛒 Found brands:', brandsWithCount.length);
    
    res.json({
      success: true,
      data: brandsWithCount.filter(brand => brand.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error("❌ Error fetching brands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
      error: error.message
    });
  }
});

// ============================================
// GET ALL PRODUCTS WITH ADVANCED FILTERING
// ============================================
router.get("/", async (req, res) => {
  try {
    console.log('🛒 GET /products - Query params:', req.query);

    // Build query object
    const query = {};

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
      console.log('🛒 Filtering by category:', req.query.category);
    }

    // Brand filter (case-insensitive)
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = { $regex: req.query.brand, $options: "i" };
      console.log('🛒 Filtering by brand:', req.query.brand);
    }

    // In-stock filter
    if (req.query.inStock && req.query.inStock !== 'all') {
      query.inStock = req.query.inStock === 'true';
      console.log('🛒 Filtering by stock status:', req.query.inStock);
    }

    // Featured filter
    if (req.query.featured && req.query.featured !== 'all') {
      query.featured = req.query.featured === 'true';
      console.log('🛒 Filtering by featured status:', req.query.featured);
    }

    // Search filter
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { category: { $regex: req.query.search, $options: "i" } },
        { brand: { $regex: req.query.search, $options: "i" } }
      ];
      console.log('🛒 Searching for:', req.query.search);
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
      console.log('🛒 Price range filter:', query.price);
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: -1 };
    switch (req.query.sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        break;
      case 'category':
        sortOptions = { category: 1, name: 1 };
        break;
      case 'random':
        // For random sorting, we'll use aggregation pipeline
        break;
    }

    let products;
    let total;

    if (req.query.sort === 'random') {
      // ✅ FIXED: Use simple aggregation for random sorting
      const pipeline = [
        { $match: query },
        { $sample: { size: limit } }
      ];
      
      products = await Product.aggregate(pipeline);
      total = await Product.countDocuments(query);
      
      // ✅ FIXED: Add computed fields using JavaScript
      products = products.map(addProductFields);
    } else {
      // Regular query with sorting
      total = await Product.countDocuments(query);
      
      const dbProducts = await Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean();

      // ✅ FIXED: Add computed fields using JavaScript
      products = dbProducts.map(addProductFields);
    }

    console.log(`🛒 Found ${products.length} products (Total: ${total})`);

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
        category: req.query.category || 'all',
        brand: req.query.brand || 'all',
        inStock: req.query.inStock || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest',
        featured: req.query.featured || 'all'
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

// ============================================
// GET SINGLE PRODUCT BY ID
// ============================================
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🛒 GET /api/products/:id - Product ID:', req.params.id);
    
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      console.log('🛒 Product not found');
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // ✅ FIXED: Add computed fields using JavaScript
    const enrichedProduct = addProductFields(product);

    // Increment views
    await Product.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

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
// PROTECTED ROUTES (Admin only)
// ============================================

// Create new product
router.post('/', protect, admin, validateProductData, async (req, res) => {
  try {
    console.log('🛒 POST /products - Creating new product');
    
    const product = new Product(req.body);
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

// Update product
router.put('/:id', protect, admin, validateObjectId, validateProductData, async (req, res) => {
  try {
    console.log('🛒 PUT /products/:id - Updating product:', req.params.id);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    
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

// Delete product
router.delete('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log('🛒 DELETE /products/:id - Deleting product:', req.params.id);
    
    const product = await Product.findByIdAndDelete(req.params.id);
    
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