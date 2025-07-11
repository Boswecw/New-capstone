// server/routes/products.js - FIXED TO HANDLE STRING IDS LIKE "prod_001"
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, optionalAuth } = require('../middleware/auth');

// @desc    Get all products with optional filters
// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    console.log('🛍️ GET /api/products - Query params:', req.query);
    
    const query = {};

    // Build query based on filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.brand) query.brand = { $regex: req.query.brand, $options: 'i' };
    if (req.query.inStock !== undefined) query.inStock = req.query.inStock === 'true';
    
    // Price range filter
    if (req.query.minPrice) query.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }
    
    // Search functionality
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: regex },
        { title: regex },
        { description: regex },
        { brand: regex },
        { category: regex }
      ];
    }

    // Featured products filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    console.log('🛍️ Built query:', query);

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_low':
          sortOptions = { price: 1 };
          break;
        case 'price_high':
          sortOptions = { price: -1 };
          break;
        case 'name':
          sortOptions = { name: 1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const products = await Product.find(query).sort(sortOptions);
    
    console.log(`🛍️ Found ${products.length} products`);
    
    res.json({ 
      success: true, 
      data: products, 
      count: products.length,
      query: req.query 
    });
    
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// @desc    Get product by ID (ENHANCED - handles both ObjectId and string IDs)
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🛍️ GET /api/products/${productId} - Attempting to find product`);
    
    let product = null;
    const searchMethods = [];

    // Method 1: Try direct _id match (works for both ObjectId and string)
    try {
      console.log(`🔍 Method 1: Direct _id lookup for "${productId}"`);
      product = await Product.findOne({ _id: productId });
      searchMethods.push({ method: 'direct_id', success: !!product, id: productId });
      if (product) {
        console.log(`✅ Found product via direct _id: ${product.name || product.title}`);
        return res.json({ success: true, data: product, searchMethod: 'direct_id' });
      }
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
      searchMethods.push({ method: 'direct_id', success: false, error: error.message });
    }

    // Method 2: Try as MongoDB ObjectId (if it looks like one)
    if (mongoose.Types.ObjectId.isValid(productId) && productId.length === 24) {
      try {
        console.log(`🔍 Method 2: ObjectId lookup for "${productId}"`);
        product = await Product.findById(productId);
        searchMethods.push({ method: 'objectid', success: !!product, id: productId });
        if (product) {
          console.log(`✅ Found product via ObjectId: ${product.name || product.title}`);
          return res.json({ success: true, data: product, searchMethod: 'objectid' });
        }
      } catch (error) {
        console.log(`❌ Method 2 failed: ${error.message}`);
        searchMethods.push({ method: 'objectid', success: false, error: error.message });
      }
    }

    // Method 3: Try raw MongoDB collection search (bypasses Mongoose validation)
    try {
      console.log(`🔍 Method 3: Raw collection lookup for "${productId}"`);
      const collection = mongoose.connection.db.collection('products');
      const rawResult = await collection.findOne({ _id: productId });
      searchMethods.push({ method: 'raw_collection', success: !!rawResult, id: productId });
      if (rawResult) {
        console.log(`✅ Found product via raw collection: ${rawResult.name || rawResult.title}`);
        return res.json({ success: true, data: rawResult, searchMethod: 'raw_collection' });
      }
    } catch (error) {
      console.log(`❌ Method 3 failed: ${error.message}`);
      searchMethods.push({ method: 'raw_collection', success: false, error: error.message });
    }

    // Method 4: Search by name pattern (e.g., "prod_001" -> "Product 001")
    if (productId.startsWith('prod_')) {
      try {
        const nameNumber = productId.replace('prod_', ''); // Remove 'prod_' prefix
        const searchName = `Product ${nameNumber}`;
        console.log(`🔍 Method 4: Name search for "${searchName}"`);
        product = await Product.findOne({ 
          $or: [
            { name: { $regex: searchName, $options: 'i' } },
            { title: { $regex: searchName, $options: 'i' } }
          ]
        });
        searchMethods.push({ method: 'name_pattern', success: !!product, searchName });
        if (product) {
          console.log(`✅ Found product via name pattern: ${product.name || product.title}`);
          return res.json({ success: true, data: product, searchMethod: 'name_pattern' });
        }
      } catch (error) {
        console.log(`❌ Method 4 failed: ${error.message}`);
        searchMethods.push({ method: 'name_pattern', success: false, error: error.message });
      }
    }

    // Method 5: Search by partial name match
    try {
      console.log(`🔍 Method 5: Partial name search for "${productId}"`);
      product = await Product.findOne({ 
        $or: [
          { name: { $regex: productId, $options: 'i' } },
          { title: { $regex: productId, $options: 'i' } }
        ]
      });
      searchMethods.push({ method: 'partial_name', success: !!product, searchTerm: productId });
      if (product) {
        console.log(`✅ Found product via partial name: ${product.name || product.title}`);
        return res.json({ success: true, data: product, searchMethod: 'partial_name' });
      }
    } catch (error) {
      console.log(`❌ Method 5 failed: ${error.message}`);
      searchMethods.push({ method: 'partial_name', success: false, error: error.message });
    }

    // Method 6: List all products to see what IDs actually exist
    try {
      console.log(`🔍 Method 6: Listing all product IDs for debugging`);
      const allProducts = await Product.find({}, { _id: 1, name: 1, title: 1 }).limit(10);
      const productIds = allProducts.map(p => ({ 
        id: p._id, 
        name: p.name || p.title || 'Unnamed Product' 
      }));
      console.log('📋 Available product IDs:', productIds);
      searchMethods.push({ method: 'list_all', success: true, availableIds: productIds });
    } catch (error) {
      console.log(`❌ Method 6 failed: ${error.message}`);
      searchMethods.push({ method: 'list_all', success: false, error: error.message });
    }

    // No product found with any method
    console.log(`❌ Product not found with ID: ${productId}`);
    console.log('📊 Search methods tried:', searchMethods);

    return res.status(404).json({ 
      success: false, 
      message: 'Product not found',
      productId: productId,
      searchMethods: searchMethods,
      suggestion: 'Check available product IDs or try browsing all products'
    });

  } catch (err) {
    console.error('❌ Error in product lookup:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message,
      productId: req.params.id 
    });
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ 
      success: true, 
      data: categories.filter(cat => cat) // Remove null/undefined values
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get product brands
// @route   GET /api/products/brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json({ 
      success: true, 
      data: brands.filter(brand => brand) // Remove null/undefined values
    });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;