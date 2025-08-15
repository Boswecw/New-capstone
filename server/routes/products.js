// server/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { enrichEntityWithImages } = require('../utils/imageUtils');

/**
 * GET /api/products
 * Query params: featured, limit, page, category, inStock, minPrice, maxPrice
 */
router.get('/', async (req, res) => {
  try {
    const {
      featured,
      limit = 20,
      page = 1,
      category,
      inStock,
      minPrice,
      maxPrice,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    // Handle featured filter
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }
    
    // InStock filter
    if (inStock === 'true' || inStock === true) {
      query.inStock = true;
    } else if (inStock === 'false' || inStock === false) {
      query.inStock = false;
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Enrich with image URLs
    const enrichedProducts = products.map(product => 
      enrichEntityWithImages(product, 'product')
    );

    console.log(`✅ Returning ${enrichedProducts.length} products (query: ${JSON.stringify(query)})`);

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
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

/**
 * GET /api/products/featured
 * Legacy endpoint for backward compatibility
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured products
    let products = await Product.find({ 
      inStock: true, 
      featured: true 
    })
    .sort('-createdAt')
    .limit(limit)
    .lean();

    // If not enough featured products, fill with regular in-stock products
    if (products.length < limit) {
      const additionalProducts = await Product.find({
        inStock: true,
        featured: { $ne: true },
        _id: { $nin: products.map(p => p._id) }
      })
      .sort('-createdAt')
      .limit(limit - products.length)
      .lean();
      
      products = [...products, ...additionalProducts];
    }

    // Enrich with image URLs
    const enrichedProducts = products.map(product => 
      enrichEntityWithImages(product, 'product')
    );

    console.log(`✅ Returning ${enrichedProducts.length} featured products`);

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length
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

/**
 * GET /api/products/categories
 * Get all product categories with counts
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { inStock: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }},
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      avgPrice: Math.round(cat.avgPrice * 100) / 100
    }));

    res.json({
      success: true,
      data: formattedCategories
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

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Enrich with image URL
    const enrichedProduct = enrichEntityWithImages(product, 'product');

    res.json({
      success: true,
      data: enrichedProduct
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

module.exports = router;