// server/routes/products.js - UPDATED WITH FIXED IMAGE HANDLING

const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getImageUrl, addImageFields } = require('../utils/imageUtils');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// Constants
const BUCKET_BASE = 'https://storage.googleapis.com/furbabies-petstore';

// ===== VALIDATION FUNCTIONS =====
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid product ID format",
      productId: req.params.id
    });
  }
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

// ===== IMAGE UTILITIES =====

/**
 * Extract image from product object - tries multiple field names
 */
const extractProductImage = (product) => {
  const sources = [
    product.image,
    product.imageUrl,
    product.photo,
    product.picture,
    Array.isArray(product.images) ? product.images[0]?.url || product.images[0] : null,
    Array.isArray(product.photos) ? product.photos[0]?.url || product.photos[0] : null,
    product.media?.image,
    product.imagePath
  ];

  return sources.find(source => source && typeof source === 'string') || null;
};

/**
 * Category-specific fallback images
 */
const getCategoryFallback = (category) => {
  const fallbacks = {
    'dog care': `${BUCKET_BASE}/placeholders/dog-product.png`,
    'cat care': `${BUCKET_BASE}/placeholders/cat-product.png`,
    'aquarium & fish care': `${BUCKET_BASE}/placeholders/fish-product.png`,
    'bird care': `${BUCKET_BASE}/placeholders/bird-product.png`,
    'grooming & health': `${BUCKET_BASE}/placeholders/grooming-product.png`,
    'training & behavior': `${BUCKET_BASE}/placeholders/training-product.png`,
    'toys & enrichment': `${BUCKET_BASE}/placeholders/toy-product.png`,
    'food & treats': `${BUCKET_BASE}/placeholders/food-product.png`,
    'accessories': `${BUCKET_BASE}/placeholders/accessory-product.png`,
    'default': `${BUCKET_BASE}/placeholders/product.png`
  };

  const categoryKey = (category || 'default').toLowerCase();
  return fallbacks[categoryKey] || fallbacks.default;
};

/**
 * Enrich product object with proper imageUrl using fixed image utilities
 */
const enrichProductWithImage = (product) => {
  // Convert mongoose document to plain object if needed
  const productObj = product.toObject ? product.toObject() : product;
  
  // Extract candidate image
  const candidateImage = extractProductImage(productObj);
  
  // ✅ FIXED: Use server imageUtils with no URL encoding
  const resolvedImageUrl = getImageUrl(candidateImage);
  
  // Get category-specific fallback
  const fallbackUrl = getCategoryFallback(productObj.category);
  
  // Use resolved URL or fallback
  const finalImageUrl = resolvedImageUrl || fallbackUrl;
  
  console.log('🖼️ Product image enrichment:', {
    productName: productObj.name,
    productId: productObj._id,
    productCategory: productObj.category,
    candidateImage,
    resolvedImageUrl,
    fallbackUrl,
    finalImageUrl
  });

  return {
    ...productObj,
    imageUrl: finalImageUrl,
    fallbackImageUrl: `/api/images/fallback/product`,
    originalImagePath: candidateImage, // Keep for debugging
    displayName: productObj.name || productObj.title || 'Unnamed Product',
    priceDisplay: `$${parseFloat(productObj.price || 0).toFixed(2)}`,
    isInStock: Boolean(productObj.inStock !== false)
  };
};

// ===== PUBLIC ROUTES =====

/**
 * GET /api/products/meta/categories - Get product categories with counts
 */
router.get('/meta/categories', async (req, res) => {
  try {
    console.log('🛍️ GET /products/meta/categories');
    
    const categories = await Product.distinct('category');
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category });
        return { name: category, count };
      })
    );

    const validCategories = categoriesWithCount
      .filter(cat => cat.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Found ${validCategories.length} categories`);
    
    res.json({
      success: true,
      data: validCategories
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

/**
 * GET /api/products/meta/brands - Get product brands with counts
 */
router.get('/meta/brands', async (req, res) => {
  try {
    console.log('🛍️ GET /products/meta/brands');
    
    const brands = await Product.distinct('brand');
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const count = await Product.countDocuments({ brand });
        return { name: brand, count };
      })
    );

    const validBrands = brandsWithCount
      .filter(brand => brand.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Found ${validBrands.length} brands`);
    
    res.json({
      success: true,
      data: validBrands
    });
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message
    });
  }
});

/**
 * GET /api/products/featured - Get featured products
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    console.log(`⭐ Fetching ${limit} featured products`);

    const featuredProducts = await Product.find({ 
      featured: true, 
      inStock: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    console.log(`✅ Found ${featuredProducts.length} featured products`);

    // Enrich with proper image URLs
    const enrichedProducts = featuredProducts.map(enrichProductWithImage);

    res.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length
    });

  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
});

/**
 * GET /api/products - List products with filters and search
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      inStock,
      featured,
      search,
      sort = 'newest',
      minPrice,
      maxPrice,
      limit = 20,
      skip = 0,
      page = 1
    } = req.query;

    console.log('🔍 Product search request:', { 
      category, brand, inStock, featured, search, sort, minPrice, maxPrice, limit 
    });

    // Build query object
    const query = {};
    
    // Category filter
    if (category && category !== 'all') {
      query.category = new RegExp(category, 'i');
    }
    
    // Brand filter
    if (brand && brand !== 'all') {
      query.brand = new RegExp(brand, 'i');
    }
    
    // Stock filter (handle both boolean and string)
    if (inStock && inStock !== 'all') {
      query.inStock = inStock === 'true' || inStock === true;
    }
    
    // Featured filter (handle both boolean and string)
    if (featured && featured !== 'all') {
      query.featured = featured === 'true' || featured === true;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { features: { $in: [searchRegex] } },
        { benefits: { $in: [searchRegex] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'featured':
        sortOption = { featured: -1, createdAt: -1 };
        break;
      case 'brand':
        sortOption = { brand: 1, name: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 items per request
    const skipNum = parseInt(skip) || ((parseInt(page) - 1) * limitNum);

    console.log('📊 Query details:', {
      query: JSON.stringify(query),
      sort: sortOption,
      limit: limitNum,
      skip: skipNum
    });

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortOption)
        .limit(limitNum)
        .skip(skipNum)
        .lean(), // Use lean() for better performance
      Product.countDocuments(query)
    ]);

    console.log(`✅ Found ${products.length} products (${totalCount} total)`);

    // Enrich products with proper image URLs
    const enrichedProducts = products.map(enrichProductWithImage);

    // Response with pagination metadata
    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        total: totalCount,
        page: parseInt(page) || 1,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: skipNum + limitNum < totalCount,
        hasPrev: skipNum > 0
      },
      filters: {
        applied: { category, brand, inStock, featured, search, minPrice, maxPrice },
        total: Object.keys(query).length
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/products/:id - Get single product by ID
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Fetching product details for ID: ${id}`);

    const product = await Product.findById(id).lean();

    if (!product) {
      console.log(`❌ Product not found: ${id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Product not found',
        productId: id
      });
    }

    console.log(`✅ Found product: ${product.name} (${product.category})`);

    // Enrich with proper image URL
    const enrichedProduct = enrichProductWithImage(product);

    res.json({
      success: true,
      data: enrichedProduct
    });

  } catch (error) {
    console.error(`❌ Error fetching product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message,
      productId: req.params.id
    });
  }
});

/**
 * GET /api/products/stats - Get product statistics
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Generating product statistics');

    const [
      totalProducts,
      inStockProducts,
      outOfStockProducts,
      categoryStats,
      brandStats,
      featuredProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ inStock: true }),
      Product.countDocuments({ inStock: false }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.countDocuments({ featured: true })
    ]);

    const stats = {
      overview: {
        total: totalProducts,
        inStock: inStockProducts,
        outOfStock: outOfStockProducts,
        featured: featuredProducts
      },
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byBrand: brandStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      stockRate: totalProducts > 0 ? ((inStockProducts / totalProducts) * 100).toFixed(1) : 0
    };

    console.log('✅ Product statistics generated:', stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error generating product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate product statistics',
      error: error.message
    });
  }
});

// ===== ADMIN ROUTES (Protected) =====

/**
 * POST /api/products - Create new product (Admin only)
 */
router.post('/', protect, admin, validateProductData, async (req, res) => {
  try {
    console.log('🛍️ Creating new product');
    console.log('📝 Request body:', req.body);

    // Create product with defaults and proper data types
    const productData = {
      name: req.body.name,
      title: req.body.title || req.body.name,
      category: req.body.category,
      brand: req.body.brand || 'Generic',
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
      image: req.body.image || '',
      
      // Stock and availability (ensure proper boolean types)
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : true,
      stockQuantity: parseInt(req.body.stockQuantity) || 0,
      featured: Boolean(req.body.featured),
      
      // Product details
      weight: req.body.weight || null,
      dimensions: req.body.dimensions || null,
      sku: req.body.sku || null,
      
      // Features and benefits (ensure arrays)
      features: Array.isArray(req.body.features) ? req.body.features : [],
      benefits: Array.isArray(req.body.benefits) ? req.body.benefits : [],
      
      // Metadata
      createdBy: req.user._id,
      createdAt: new Date()
    };

    const product = new Product(productData);
    await product.save();

    console.log(`✅ Product created: ${product.name} (ID: ${product._id})`);

    // Return enriched product
    const enrichedProduct = enrichProductWithImage(product);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: enrichedProduct
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

/**
 * PUT /api/products/:id - Update product (Admin only)
 */
router.put('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(`🛍️ Updating product: ${req.params.id}`);
    console.log('📝 Update data:', req.body);

    const updateData = { ...req.body };
    
    // Ensure proper data types
    if (req.body.price !== undefined) {
      updateData.price = parseFloat(req.body.price);
    }
    if (req.body.originalPrice !== undefined) {
      updateData.originalPrice = parseFloat(req.body.originalPrice);
    }
    if (req.body.stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(req.body.stockQuantity);
    }
    if (req.body.inStock !== undefined) {
      updateData.inStock = Boolean(req.body.inStock);
    }
    if (req.body.featured !== undefined) {
      updateData.featured = Boolean(req.body.featured);
    }
    
    // Add update metadata
    updateData.updatedBy = req.user._id;
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

    console.log(`✅ Product updated: ${product.name}`);

    // Return enriched product
    const enrichedProduct = enrichProductWithImage(product);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: enrichedProduct
    });
    
  } catch (error) {
    console.error(`❌ Error updating product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

/**
 * DELETE /api/products/:id - Delete product (Admin only)
 */
router.delete('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(`🛍️ Deleting product: ${req.params.id}`);

    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log(`✅ Product deleted: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: req.params.id, name: product.name }
    });
    
  } catch (error) {
    console.error(`❌ Error deleting product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

/**
 * PATCH /api/products/:id/toggle-stock - Toggle product stock status (Admin only)
 */
router.patch('/:id/toggle-stock', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(`🛍️ Toggling stock for product: ${req.params.id}`);

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.inStock = !product.inStock;
    product.updatedBy = req.user._id;
    product.updatedAt = new Date();
    await product.save();

    console.log(`✅ Product stock toggled: ${product.name} -> ${product.inStock ? 'In Stock' : 'Out of Stock'}`);

    // Return enriched product
    const enrichedProduct = enrichProductWithImage(product);

    res.json({
      success: true,
      message: `Product marked as ${product.inStock ? 'in stock' : 'out of stock'}`,
      data: enrichedProduct
    });
    
  } catch (error) {
    console.error(`❌ Error toggling product stock ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product stock',
      error: error.message
    });
  }
});

module.exports = router;