// server/routes/products.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// Simple function to add image URLs - NO EXTERNAL DEPENDENCIES
const addImageUrl = (entity, entityType = 'product') => {
  if (!entity) return entity;
  
  const baseUrl = 'https://storage.googleapis.com/furbabies-petstore';
  
  return {
    ...entity,
    imageUrl: entity.image ? `${baseUrl}/${entity.image}` : null,
    hasImage: !!entity.image
  };
};

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

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
    
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }
    
    if (inStock === 'true') {
      query.inStock = true;
    } else if (inStock === 'false') {
      query.inStock = false;
    }
    
    if (category && category !== 'all') {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Product.countDocuments(query)
    ]);

    // ✅ FIXED: Add image URLs without missing function
    const productsWithImages = products.map(product => addImageUrl(product, 'product'));

    console.log(`✅ Returning ${productsWithImages.length} products`);

    res.json({
      success: true,
      data: productsWithImages,
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

// GET /api/products/featured - Featured products endpoint
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured products
    let products = await Product.find({ 
      inStock: true, 
      featured: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Fill with regular products if not enough featured ones
    if (products.length < limit) {
      const additionalProducts = await Product.find({
        inStock: true,
        featured: { $ne: true },
        _id: { $nin: products.map(p => p._id) }
      })
      .sort({ createdAt: -1 })
      .limit(limit - products.length)
      .lean();
      
      products = [...products, ...additionalProducts];
    }

    // ✅ FIXED: Add image URLs without missing function
    const productsWithImages = products.map(product => addImageUrl(product, 'product'));

    console.log(`✅ Returning ${productsWithImages.length} featured products`);

    res.json({
      success: true,
      data: productsWithImages,
      count: productsWithImages.length
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

// GET /api/products/categories - Get product categories
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

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // ✅ FIXED: Add image URL without missing function
    const productWithImage = addImageUrl(product, 'product');

    res.json({
      success: true,
      data: productWithImage
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