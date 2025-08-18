// server/routes/products.js - COMPLETE FILE WITH OBJECTID CASTING FIX
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

<<<<<<< HEAD
// ===== HELPER FUNCTIONS =====
const addImageUrl = (product) => {
  if (!product) return product;
  
  return {
    ...product,
    imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
    hasImage: !!product.image,
    displayName: product.name || product.title || 'Unnamed Product',
    isInStock: product.inStock !== false,
    stockStatus: product.inStock === false ? 'Out of Stock' : 'In Stock'
  };
};
=======
// ✅ ADVANCED FILTER MAPPING for PRODUCTS
const mapProductFiltersToQuery = (filters) => {
  const query = { inStock: true }; // Only show in-stock products
  const orConditions = [];

  // ✅ FEATURED filtering - Handle both boolean and string
  if (filters.featured === 'true' || filters.featured === true) {
    orConditions.push([
      { featured: true },
      { featured: "true" } // Handle string version from your data
    ]);
  }

  // ✅ CATEGORY mapping
  if (filters.category && filters.category !== 'all') {
    switch (filters.category.toLowerCase()) {
      case 'food':
        query.category = new RegExp('(dog care|cat care)', 'i');
        query.name = new RegExp('(food|kibble)', 'i');
        break;
      case 'toys':
        query.name = new RegExp('toy', 'i');
        break;
      case 'accessories':
        query.category = new RegExp('(dog care|cat care)', 'i');
        query.name = new RegExp('(harness|leash|collar|bed)', 'i');
        break;
      case 'health':
        query.category = new RegExp('(grooming|health)', 'i');
        break;
      case 'aquarium':
        query.category = new RegExp('aquarium', 'i');
        break;
      default:
        query.category = new RegExp(filters.category, 'i');
    }
  }

  // ✅ BRAND filtering
  if (filters.brand && filters.brand !== 'all') {
    query.brand = new RegExp(filters.brand, 'i');
  }

  // ✅ PRICE RANGE filtering
  if (filters.priceRange && filters.priceRange !== 'all') {
    const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
    if (max) {
      query.price = { $gte: parseFloat(min), $lte: parseFloat(max) };
    } else {
      query.price = { $gte: parseFloat(min) };
    }
  }

  // ✅ SEARCH across multiple fields
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    orConditions.push([
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ]);
  }

  if (orConditions.length > 1) {
    console.log('🔍 Combining featured and search filters with $and');
  }

  if (orConditions.length === 1) {
    query.$or = orConditions[0];
  } else if (orConditions.length > 1) {
    query.$and = orConditions.map(cond => ({ $or: cond }));
  }

  console.log('🛍️ Mapped product filters to query:', JSON.stringify(query, null, 2));
  return query;
};
>>>>>>> 17deaf0 (Handle combined featured and search filters)

// ===== VALIDATION FUNCTIONS =====
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

// ===== METADATA ROUTES (Must come before /:id route) =====

// @desc Get product categories
// @route GET /api/products/meta/categories
// @access Public
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
// @route GET /api/products/meta/brands
// @access Public
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

// @desc Get featured products
// @route GET /api/products/featured
// @access Public
router.get("/featured", async (req, res) => {
  try {
    console.log('🛒 GET /products/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const productsWithImages = products.map(product => addImageUrl(product));

    console.log(`🛒 Found ${products.length} featured products`);

    res.json({
      success: true,
      data: productsWithImages
    });
  } catch (error) {
    console.error("❌ Error fetching featured products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message
    });
  }
});

// ===== MAIN ROUTES =====

// @desc Get all products with advanced filtering
// @route GET /api/products
// @access Public
router.get("/", async (req, res) => {
  try {
    console.log('🛒 GET /products - Query params:', req.query);

    // Build query object
    const query = {};

    // Extract query parameters
    const {
      category,
      brand,
      inStock,
      minPrice,
      maxPrice,
      search,
      featured,
      page = 1,
      limit = 12,
      sort = 'newest'
    } = req.query;

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
      console.log('🛒 Filtering by category:', category);
    }

    // Brand filter (case-insensitive)
    if (brand && brand !== 'all') {
      query.brand = { $regex: brand, $options: "i" };
      console.log('🛒 Filtering by brand:', brand);
    }

    // Stock filter
    if (inStock === 'true') {
      query.inStock = true;
      console.log('🛒 Showing only in-stock products');
    } else if (inStock === 'false') {
      query.inStock = false;
      console.log('🛒 Showing only out-of-stock products');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
        console.log('🛒 Min price:', minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
        console.log('🛒 Max price:', maxPrice);
      }
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
      console.log('🛒 Showing only featured products');
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
      console.log('🛒 Search term:', search);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default newest first
    
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    console.log('🛒 MongoDB query:', JSON.stringify(query, null, 2));
    console.log('🛒 Sort options:', sortOptions);

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Add computed fields to each product
    const productsWithImages = products.map(product => addImageUrl(product));

    console.log(`✅ Found ${products.length} products (${total} total)`);

    // Return success response
    res.json({
      success: true,
      data: productsWithImages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + products.length < total
      },
      filters: {
        category: category || 'all',
        brand: brand || 'all',
        inStock: inStock || 'all',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        search: search || '',
        featured: featured || 'all',
        sort: sort || 'newest'
      }
    });

  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
});

// ===== INDIVIDUAL PRODUCT BY ID - FIXED TO BYPASS OBJECTID CASTING =====
// @desc Get single product by ID
// @route GET /api/products/:id
// @access Public
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🔍 SEARCHING FOR PRODUCT: ${productId}`);
    
    if (!productId || productId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        received: productId
      });
    }
    
    // ✅ Use native MongoDB query to bypass Mongoose ObjectId casting
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Find the product using native MongoDB query (no ObjectId casting)
    const product = await productsCollection.findOne({ _id: productId });
    
    if (!product) {
      console.log(`❌ PRODUCT ${productId} NOT FOUND`);
      
      // Get all products to show available IDs
      const allProducts = await productsCollection.find({}, { projection: { _id: 1, name: 1 } }).limit(20).toArray();
      console.log('📋 ALL PRODUCTS IN DATABASE:', allProducts.map(p => `${p._id} (${p.name})`));
      
      return res.status(404).json({
        success: false,
        message: `Product ${productId} not found`,
        searchedId: productId,
        availableIds: allProducts.map(p => p._id).slice(0, 10),
        totalProducts: allProducts.length,
        debug: {
          searchedFor: productId,
          totalInDatabase: allProducts.length,
          firstFew: allProducts.slice(0, 5).map(p => ({
            id: p._id,
            name: p.name
          }))
        }
      });
    }

    console.log(`✅ FOUND PRODUCT: ${product.name}`);
    
    // Add image URL and computed fields
    const productWithImage = {
      ...product,
      imageUrl: product.image ? `https://storage.googleapis.com/furbabies-petstore/${product.image}` : null,
      hasImage: !!product.image,
      displayName: product.name || product.title || 'Unnamed Product',
      isInStock: product.inStock !== false,
      stockStatus: product.inStock === false ? 'Out of Stock' : 'In Stock'
    };
    
    res.json({
      success: true,
      data: productWithImage
    });
    
  } catch (error) {
    console.error(`❌ ERROR FINDING PRODUCT ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// ===== ADMIN ROUTES (Protected) =====

// @desc Create new product (Admin only)
// @route POST /api/products
// @access Private/Admin
router.post("/", protect, admin, validateProductData, async (req, res) => {
  try {
    console.log('🛒 POST /products - Creating new product');
    console.log('🛒 Request body:', req.body);

    // Create product with defaults
    const productData = {
      name: req.body.name,
      title: req.body.title || req.body.name, // Use name as fallback for title
      category: req.body.category,
      brand: req.body.brand || 'Generic',
      price: parseFloat(req.body.price),
      description: req.body.description || '',
      image: req.body.image || '',
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      featured: req.body.featured || false,
      createdBy: req.user._id,
      createdAt: new Date()
    };

    const product = new Product(productData);
    await product.save();

    const productWithImage = addImageUrl(product.toObject());

    console.log('🛒 Product created:', product._id);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: productWithImage
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
});

// @desc Update product (Admin only)
// @route PUT /api/products/:id
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    console.log('🛒 PUT /products/:id - Updating product:', req.params.id);
    console.log('🛒 Update data:', req.body);

    const updateData = { ...req.body };
    
    // Ensure price is a number if provided
    if (req.body.price !== undefined) {
      updateData.price = parseFloat(req.body.price);
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
        message: "Product not found"
      });
    }

    const productWithImage = addImageUrl(product.toObject());

    console.log('🛒 Product updated successfully');

    res.json({
      success: true,
      message: "Product updated successfully",
      data: productWithImage
    });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
});

// @desc Delete product (Admin only)
// @route DELETE /api/products/:id
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    console.log('🛒 DELETE /products/:id - Deleting product:', req.params.id);

    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    console.log('🛒 Product deleted successfully');

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: product
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
});

// @desc Toggle product stock status (Admin only)
// @route PATCH /api/products/:id/toggle-stock
// @access Private/Admin
router.patch("/:id/toggle-stock", protect, admin, async (req, res) => {
  try {
    console.log('🛒 PATCH /products/:id/toggle-stock - Product ID:', req.params.id);

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    product.inStock = !product.inStock;
    product.updatedBy = req.user._id;
    product.updatedAt = new Date();
    await product.save();

    const productWithImage = addImageUrl(product.toObject());

    console.log(`🛒 Product stock toggled to: ${product.inStock}`);

    res.json({
      success: true,
      message: `Product marked as ${product.inStock ? 'in stock' : 'out of stock'}`,
      data: productWithImage
    });
  } catch (error) {
    console.error("❌ Error toggling product stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle product stock",
      error: error.message
    });
  }
});

module.exports = router;
