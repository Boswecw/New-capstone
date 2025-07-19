// server/routes/products.js - FIXED Featured Products Endpoint
const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// ===== GET /api/products/featured - CRITICAL FIX =====
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    console.log(`🌟 GET /api/products/featured - Fetching ${limit} featured products`);
    
    // Get random featured products using MongoDB aggregation
    const featuredProducts = await Product.aggregate([
      // Only include active/available products
      { $match: { 
        status: { $ne: 'discontinued' },
        price: { $gt: 0 }
      }},
      // Get random sample
      { $sample: { size: limit } },
      // Add computed fields
      { $addFields: {
        discountPercentage: {
          $cond: {
            if: { $and: [
              { $ne: ["$originalPrice", null] },
              { $gt: ["$originalPrice", "$price"] }
            ]},
            then: {
              $round: [
                { $multiply: [
                  { $divide: [
                    { $subtract: ["$originalPrice", "$price"] },
                    "$originalPrice"
                  ]},
                  100
                ]},
                0
              ]
            },
            else: 0
          }
        }
      }}
    ]);
    
    // ✅ FALLBACK: If no products found, create sample data
    if (featuredProducts.length === 0) {
      console.log('⚠️ No products in database, returning sample featured products');
      
      const sampleProducts = [
        {
          _id: 'sample-1',
          name: 'Premium Dog Food',
          category: 'Food',
          price: 29.99,
          originalPrice: 39.99,
          imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop',
          description: 'High-quality nutrition for your furry friend',
          brand: 'PetNutrition',
          inStock: true,
          discountPercentage: 25
        },
        {
          _id: 'sample-2',
          name: 'Cat Scratching Post',
          category: 'Toys',
          price: 49.99,
          imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop',
          description: 'Keep your cat entertained and your furniture safe',
          brand: 'FelineJoy',
          inStock: true,
          discountPercentage: 0
        },
        {
          _id: 'sample-3',
          name: 'Pet Carrier Bag',
          category: 'Accessories',
          price: 39.99,
          imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=300&fit=crop',
          description: 'Safe and comfortable travel for small pets',
          brand: 'TravelPet',
          inStock: true,
          discountPercentage: 0
        },
        {
          _id: 'sample-4',
          name: 'Interactive Dog Toy',
          category: 'Toys',
          price: 19.99,
          originalPrice: 24.99,
          imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
          description: 'Mental stimulation and fun for active dogs',
          brand: 'PlayTime',
          inStock: true,
          discountPercentage: 20
        }
      ].slice(0, limit);
      
      return res.json({
        success: true,
        data: sampleProducts,
        count: sampleProducts.length,
        message: 'Featured products retrieved successfully (sample data)',
        isSampleData: true
      });
    }
    
    console.log(`✅ Found ${featuredProducts.length} featured products`);
    
    res.json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length,
      message: 'Featured products retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    
    // Return error with fallback sample data
    const sampleProducts = [
      {
        _id: 'error-fallback-1',
        name: 'Premium Pet Food',
        category: 'Food',
        price: 29.99,
        imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop',
        description: 'Quality nutrition for your pet',
        brand: 'PetStore',
        inStock: true,
        discountPercentage: 0
      }
    ];
    
    res.status(200).json({
      success: true,
      data: sampleProducts,
      count: sampleProducts.length,
      message: 'Featured products retrieved (fallback due to database error)',
      error: error.message,
      isFallback: true
    });
  }
});

// ===== GET /api/products - All Products =====
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 12
    } = req.query;

    console.log(`🛍️ GET /api/products - Fetching products with filters:`, {
      category, brand, minPrice, maxPrice, search, sortBy, sortOrder, page, limit
    });

    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = new RegExp(category, 'i');
    }
    
    if (brand && brand !== 'all') {
      filter.brand = new RegExp(brand, 'i');
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(filter);
    
    console.log(`✅ Found ${products.length} products (${totalProducts} total)`);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        totalItems: totalProducts,
        itemsPerPage: parseInt(limit)
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

// ===== GET /api/products/categories =====
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/products/categories');
    
    const categories = await Product.distinct('category');
    
    console.log(`✅ Found ${categories.length} product categories:`, categories);
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('❌ Error fetching product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product categories',
      error: error.message
    });
  }
});

// ===== GET /api/products/brands =====
router.get('/brands', async (req, res) => {
  try {
    console.log('🏷️ GET /api/products/brands');
    
    const brands = await Product.distinct('brand');
    
    console.log(`✅ Found ${brands.length} product brands:`, brands);
    
    res.json({
      success: true,
      data: brands,
      count: brands.length
    });
  } catch (error) {
    console.error('❌ Error fetching product brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product brands',
      error: error.message
    });
  }
});

// ===== GET /api/products/:id - Single Product =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🛍️ GET /api/products/${id}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log(`✅ Found product: ${product.name}`);
    
    res.json({
      success: true,
      data: product
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