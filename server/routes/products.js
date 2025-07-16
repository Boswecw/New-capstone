// server/routes/products.js - ENHANCED VERSION with Random Featured Selection
const express = require('express');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const router = express.Router();

// ⭐ NEW: Get random featured products for home page
router.get('/featured', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/featured - Random selection requested');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Use MongoDB aggregation for true random selection
    const featuredProducts = await Product.aggregate([
      { 
        $match: { 
          featured: true, 
          inStock: true 
        } 
      },
      { $sample: { size: limit } }, // ⭐ This provides random selection
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
          formattedPrice: {
            $cond: {
              if: { $ne: ["$price", null] },
              then: { $concat: ["$", { $toString: "$price" }] },
              else: "N/A"
            }
          }
        }
      }
    ]);

    console.log(`🛒 Returning ${featuredProducts.length} random featured products`);
    
    res.json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length,
      message: `${featuredProducts.length} featured products selected randomly`
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

// ⭐ ENHANCED: Get all products with advanced filtering and sorting
router.get('/', async (req, res) => {
  try {
    console.log('🛒 GET /api/products - Query params:', req.query);

    // Build query object
    const query = {};

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = new RegExp(req.query.category, 'i');
    }

    // Brand filter
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = new RegExp(req.query.brand, 'i');
    }

    // Stock filter
    if (req.query.inStock === 'true') {
      query.inStock = true;
    } else if (req.query.inStock === 'false') {
      query.inStock = false;
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { brand: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
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
      // Use aggregation for random sorting
      const pipeline = [
        { $match: query },
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
            formattedPrice: {
              $cond: {
                if: { $ne: ["$price", null] },
                then: { $concat: ["$", { $toString: "$price" }] },
                else: "N/A"
              }
            }
          }
        }
      ];
      
      products = await Product.aggregate(pipeline);
      total = await Product.countDocuments(query);
    } else {
      // Regular query with sorting
      total = await Product.countDocuments(query);
      
      const dbProducts = await Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean();

      // Add computed fields
      products = dbProducts.map(product => ({
        ...product,
        imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
        hasImage: !!product.image,
        displayName: product.name || 'Unnamed Product',
        formattedPrice: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'
      }));
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

// Get single product by ID
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

    // Add computed fields
    const enrichedProduct = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || 'Unnamed Product',
      formattedPrice: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'
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

// Get product categories for filtering
router.get('/meta/categories', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/meta/categories');
    
    const categories = await Product.distinct('category');
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category });
        return { 
          _id: category, 
          name: category, 
          count,
          value: category 
        };
      })
    );

    console.log(`🛒 Found ${categoriesWithCount.length} product categories`);
    
    res.json({ 
      success: true, 
      data: categoriesWithCount.filter(c => c.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('❌ Error fetching product categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// Get product brands for filtering
router.get('/meta/brands', async (req, res) => {
  try {
    console.log('🛒 GET /api/products/meta/brands');
    
    const brands = await Product.distinct('brand');
    
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const count = await Product.countDocuments({ brand });
        return { 
          _id: brand, 
          name: brand, 
          count,
          value: brand 
        };
      })
    );

    console.log(`🛒 Found ${brandsWithCount.length} product brands`);
    
    res.json({ 
      success: true, 
      data: brandsWithCount.filter(b => b.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('❌ Error fetching product brands:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching brands', 
      error: error.message 
    });
  }
});

module.exports = router;