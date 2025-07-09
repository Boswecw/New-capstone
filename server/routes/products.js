// server/routes/products.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// Validation middleware for product queries
const validateProductQuery = (req, res, next) => {
  const { limit, page, minPrice, maxPrice } = req.query;
  
  if (limit && (isNaN(limit) || limit < 1 || limit > 50)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit parameter. Must be between 1 and 50.'
    });
  }
  
  if (page && (isNaN(page) || page < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid page parameter. Must be a positive integer.'
    });
  }
  
  if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid minPrice parameter. Must be a positive number.'
    });
  }
  
  if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid maxPrice parameter. Must be a positive number.'
    });
  }
  
  next();
};

// ===== SPECIFIC ROUTES FIRST (BEFORE GENERIC ROUTES) =====

// GET /api/products/featured - Get random products as featured
router.get('/featured', async (req, res) => {
  try {
    console.log('🌟 Fetching featured products...');
    
    const { limit = 6 } = req.query;
    
    // Get random products using MongoDB aggregation
    const featuredProducts = await Product.aggregate([
      { $match: { inStock: true } },
      { $sample: { size: parseInt(limit) } }
    ]);

    console.log(`✅ Found ${featuredProducts.length} featured products`);

    // Add full image URLs
    const productsWithUrls = featuredProducts.map(product => ({
      ...product,
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`,
      featured: true
    }));

    res.json({
      success: true,
      data: productsWithUrls,
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

// GET /api/products/categories - Get distinct categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching product categories...');
    
    const categories = await Product.distinct('category');
    console.log(`✅ Found ${categories.length} categories:`, categories);
    
    res.json({
      success: true,
      data: categories,
      message: 'Product categories retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/products/brands - Get distinct brands
router.get('/brands', async (req, res) => {
  try {
    console.log('🏷️ Fetching product brands...');
    
    const brands = await Product.distinct('brand');
    console.log(`✅ Found ${brands.length} brands:`, brands);
    
    res.json({
      success: true,
      data: brands,
      message: 'Product brands retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
});

// GET /api/products/stats - Get product statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching product statistics...');
    
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockProducts: {
            $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] }
          },
          averagePrice: { $avg: '$price' },
          totalValue: { $sum: '$price' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { inStock: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    const brandStats = await Product.aggregate([
      { $match: { inStock: true } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    console.log('✅ Product statistics calculated');

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalProducts: 0,
          inStockProducts: 0,
          outOfStockProducts: 0,
          averagePrice: 0,
          totalValue: 0
        },
        categories: categoryStats,
        brands: brandStats
      },
      message: 'Product statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
});

// ===== GENERIC ROUTES AFTER SPECIFIC ROUTES =====

// GET /api/products - Get all products with filtering and pagination
router.get('/', validateProductQuery, optionalAuth, async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      featured,
      inStock,
      limit = 12,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    console.log('📦 Products API called with params:', req.query);

    // Build query object
    const query = {};

    // Add filters
    if (category && category !== 'all' && category !== 'general') {
      query.category = category;
    }

    if (brand && brand !== 'all' && brand !== 'Generic') {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (inStock === 'true') {
      query.inStock = true;
    } else if (inStock === 'false') {
      query.inStock = false;
    }

    // Add price range filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'price-asc':
        sortOptions.price = 1;
        break;
      case 'price-desc':
        sortOptions.price = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log('🔍 MongoDB query:', query);
    console.log('📊 Sort:', sortOptions);

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum);

    console.log(`✅ Found ${products.length} products`);

    // Add full image URLs to products
    const productsWithUrls = products.map(product => ({
      ...product,
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`
    }));

    res.json({
      success: true,
      data: productsWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🔍 Fetching product with ID:', req.params.id);
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      console.log('❌ Product not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Product found:', product.name);

    // Add full image URL
    const productWithUrl = {
      ...product.toObject(),
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`
    };

    res.json({
      success: true,
      data: productWithUrl,
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// GET /api/products/:id/related - Get related products
router.get('/:id/related', validateObjectId, async (req, res) => {
  try {
    console.log('🔗 Fetching related products for ID:', req.params.id);
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find related products based on category, brand, and similar price range
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      inStock: true,
      $or: [
        { category: product.category },
        { brand: product.brand },
        { price: { $gte: product.price - 5, $lte: product.price + 5 } }
      ]
    })
      .limit(6)
      .lean();

    console.log(`✅ Found ${relatedProducts.length} related products`);

    // Add full image URLs
    const productsWithUrls = relatedProducts.map(prod => ({
      ...prod,
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${prod.image}`
    }));

    res.json({
      success: true,
      data: productsWithUrls,
      message: 'Related products retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      error: error.message
    });
  }
});

// PATCH /api/products/:id - Update product (for image assignment)
router.patch('/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🔄 Updating product:', req.params.id);
    console.log('📝 Update data:', req.body);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      console.log('❌ Product not found for update:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Product updated successfully:', product.name);

    // Add full image URL
    const productWithUrl = {
      ...product.toObject(),
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`
    };

    res.json({
      success: true,
      data: productWithUrl,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// POST /api/products - Create new product (protected route)
router.post('/', protect, async (req, res) => {
  try {
    console.log('➕ Creating new product:', req.body);
    
    const product = new Product(req.body);
    await product.save();

    console.log('✅ Product created successfully:', product.name);

    // Add full image URL
    const productWithUrl = {
      ...product.toObject(),
      imageUrl: `https://storage.googleapis.com/furbabies-petstore/${product.image}`
    };

    res.status(201).json({
      success: true,
      data: productWithUrl,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product (protected route)
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      console.log('❌ Product not found for deletion:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Product deleted successfully:', product.name);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

module.exports = router;