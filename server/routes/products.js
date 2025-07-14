// server/routes/products.js - COMPLETE UPDATED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ============================================
// SPECIFIC ROUTES FIRST (BEFORE GENERAL ROUTES)
// ============================================

// GET /api/products/categories - Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/products/categories called');
    
    // Get unique categories from products collection
    const categories = await Product.distinct('category');
    
    console.log('📂 Found categories:', categories);
    
    // If no categories, return default ones based on your data
    const defaultCategories = categories.length > 0 ? categories : [
      'Cat Care',
      'Dog Care', 
      'Aquatic',
      'General'
    ];
    
    res.json({
      success: true,
      data: defaultCategories,
      count: defaultCategories.length,
      message: 'Categories retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
});

// GET /api/products/brands - Get all unique brands  
router.get('/brands', async (req, res) => {
  try {
    console.log('🏷️ GET /api/products/brands called');
    
    // Get unique brands from products collection
    const brands = await Product.distinct('brand');
    
    console.log('🏷️ Found brands:', brands);
    
    // If no brands, return default ones based on your data
    const defaultBrands = brands.length > 0 ? brands : [
      'Generic',
      'Premium Brand',
      'Quality Pet Co'
    ];
    
    res.json({
      success: true,
      data: defaultBrands,
      count: defaultBrands.length,
      message: 'Brands retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving brands',
      error: error.message
    });
  }
});

// ============================================
// GENERAL ROUTES (AFTER SPECIFIC ROUTES)
// ============================================

// GET /api/products - Get all products with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products called with query:', req.query);
    
    // Build query object based on filters
    let query = {};
    
    // Featured filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    // In stock filter
    if (req.query.inStock === 'true') {
      query.inStock = true;
    } else if (req.query.inStock === 'false') {
      query.inStock = false;
    }
    // If inStock not specified, show all products
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    // Brand filter
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = req.query.brand;
    }
    
    // Search filter
    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { brand: new RegExp(req.query.search, 'i') }
      ];
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'name':
          sort = { name: 1 };
          break;
        case 'price-low':
          sort = { price: 1 };
          break;
        case 'price-high':
          sort = { price: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }
    
    console.log('🛒 MongoDB Query:', query);
    console.log('🛒 Limit:', limit, 'Skip:', skip, 'Sort:', sort);
    
    // Get products with query
    const products = await Product.find(query)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    
    console.log(`🛒 Found ${products.length} products in database`);
    
    // ✅ CRITICAL: Add imageUrl to each product
    const enrichedProducts = products.map(product => ({
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product'
    }));
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    console.log('🛒 Sample enriched product:', enrichedProducts[0]);
    
    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + enrichedProducts.length < total
      },
      filters: {
        applied: query,
        requested: req.query
      },
      message: `${enrichedProducts.length} products retrieved successfully`
    });
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/:id called with ID:', req.params.id);
    
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      console.log('🛒 Product not found');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Add imageUrl to the product
    const enrichedProduct = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product'
    };
    
    console.log('🛒 Product found:', enrichedProduct.displayName);
    
    res.json({
      success: true,
      data: enrichedProduct
    });
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// ============================================
// ADMIN/CRUD ROUTES (Protected - Add authentication middleware as needed)
// ============================================

// POST /api/products - Create new product (Admin only)
router.post('/', async (req, res) => {
  try {
    console.log('🛒 POST /api/products - Creating new product');
    console.log('🛒 Request body:', req.body);

    // Create product with defaults
    const productData = {
      name: req.body.name,
      category: req.body.category,
      brand: req.body.brand || 'Generic',
      price: parseFloat(req.body.price),
      description: req.body.description || '',
      image: req.body.image || '',
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      featured: req.body.featured || false,
      createdAt: new Date()
    };

    const product = new Product(productData);
    await product.save();

    console.log('🛒 Product created:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...product.toObject(),
        imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
        hasImage: !!product.image,
        displayName: product.name
      }
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

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', async (req, res) => {
  try {
    console.log('🛒 PUT /api/products/:id - Updating product:', req.params.id);

    const updateData = { ...req.body };
    updateData.updatedAt = new Date();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('🛒 Product updated successfully');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product.toObject(),
        imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
        hasImage: !!product.image,
        displayName: product.name
      }
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

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log('🛒 DELETE /api/products/:id - Deleting product:', req.params.id);

    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('🛒 Product deleted successfully');

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        deletedId: req.params.id,
        deletedName: product.name
      }
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