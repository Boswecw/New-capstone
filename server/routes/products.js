// routes/products.js - COMPLETE WORKING VERSION (NO EXTERNAL VALIDATION)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin, optionalAuth } = require("../middleware/auth");

// ===== VALIDATION FUNCTIONS (INLINE) =====
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }
  next();
};

const validateProductData = (req, res, next) => {
  const { name, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: "Name, price, and category are required",
    });
  }

  if (isNaN(price) || price < 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be a valid positive number",
    });
  }

  next();
};

// ===== SPECIFIC ROUTES FIRST (BEFORE /:id) =====

// @desc    Get product categories
// @route   GET /api/products/categories
router.get("/categories", async (req, res) => {
  try {
    console.log("📂 Getting product categories");

    const categories = await Product.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
    ]);

    console.log("✅ Found categories:", categories.length);

    res.json({
      success: true,
      data: categories,
      message: "Categories retrieved successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: err.message,
    });
  }
});

// @desc    Get product brands
// @route   GET /api/products/brands
router.get("/brands", async (req, res) => {
  try {
    console.log("🏷️ Getting product brands");

    const brands = await Product.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          brand: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("✅ Found brands:", brands.length);

    res.json({
      success: true,
      data: brands,
      message: "Brands retrieved successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching brands:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching brands",
      error: err.message,
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
router.get("/featured", async (req, res) => {
  try {
    console.log("⭐ Getting featured products");

    const { limit = 6 } = req.query;

    const products = await Product.find({
      featured: true,
      isActive: { $ne: false },
      inStock: { $ne: false },
    })
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(parseInt(limit));

    console.log("✅ Found featured products:", products.length);

    res.json({
      success: true,
      data: products,
      count: products.length,
      message: "Featured products retrieved successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching featured products:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching featured products",
      error: err.message,
    });
  }
});

// @desc    Search products
// @route   GET /api/products/search/:query
router.get("/search/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    console.log("🔍 Product search:", searchQuery);

    const { limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const searchRegex = { $regex: searchQuery, $options: "i" };

    const query = {
      isActive: { $ne: false },
      $or: [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ],
    };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const totalResults = await Product.countDocuments(query);

    console.log("✅ Search results:", totalResults);

    res.json({
      success: true,
      data: products,
      searchQuery: searchQuery,
      totalResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResults / limitNum),
        hasNext: skip + limitNum < totalResults,
        hasPrev: page > 1,
      },
      message: `Found ${totalResults} products matching "${searchQuery}"`,
    });
  } catch (err) {
    console.error("❌ Product search error:", err);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: err.message,
    });
  }
});

// ===== GENERAL ROUTES =====

// @desc    Get all products with optional filters
// @route   GET /api/products
router.get("/", async (req, res) => {
  try {
    console.log("🛍️ GET /api/products - Query params:", req.query);

    const query = { isActive: { $ne: false } };

    // Build query based on filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.brand)
      query.brand = { $regex: req.query.brand, $options: "i" };
    if (req.query.inStock !== undefined)
      query.inStock = req.query.inStock === "true";

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Search functionality
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: regex },
        { title: regex },
        { description: regex },
        { brand: regex },
        { category: regex },
      ];
    }

    // Featured products filter
    if (req.query.featured === "true") {
      query.featured = true;
    }

    console.log("🛍️ Built query:", query);

    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case "price_low":
          sortOptions = { price: 1 };
          break;
        case "price_high":
          sortOptions = { price: -1 };
          break;
        case "name":
          sortOptions = { name: 1 };
          break;
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
      }
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    console.log(
      `🛍️ Found ${products.length} products (${totalProducts} total)`
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
      },
      filters: req.query,
      message: "Products retrieved successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: err.message,
    });
  }
});

// @desc    Get product by ID (ENHANCED - handles both ObjectId and string IDs)
// @route   GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(
      `🛍️ GET /api/products/${productId} - Attempting to find product`
    );

    let product = null;
    const searchMethods = [];

    // Method 1: Try direct _id match
    try {
      console.log(`🔍 Method 1: Direct _id lookup for "${productId}"`);
      product = await Product.findOne({
        _id: productId,
        isActive: { $ne: false },
      });
      searchMethods.push({
        method: "direct_id",
        success: !!product,
        id: productId,
      });
      if (product) {
        console.log(
          `✅ Found product via direct _id: ${product.name || product.title}`
        );

        // Increment view count if product has viewCount field
        if (product.viewCount !== undefined) {
          await Product.findByIdAndUpdate(product._id, {
            $inc: { viewCount: 1 },
          });
        }

        return res.json({
          success: true,
          data: product,
          searchMethod: "direct_id",
        });
      }
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
      searchMethods.push({
        method: "direct_id",
        success: false,
        error: error.message,
      });
    }

    // Method 2: Try as MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(productId) && productId.length === 24) {
      try {
        console.log(`🔍 Method 2: ObjectId lookup for "${productId}"`);
        product = await Product.findOne({
          _id: productId,
          isActive: { $ne: false },
        });
        searchMethods.push({
          method: "objectid",
          success: !!product,
          id: productId,
        });
        if (product) {
          console.log(
            `✅ Found product via ObjectId: ${product.name || product.title}`
          );

          if (product.viewCount !== undefined) {
            await Product.findByIdAndUpdate(product._id, {
              $inc: { viewCount: 1 },
            });
          }

          return res.json({
            success: true,
            data: product,
            searchMethod: "objectid",
          });
        }
      } catch (error) {
        console.log(`❌ Method 2 failed: ${error.message}`);
        searchMethods.push({
          method: "objectid",
          success: false,
          error: error.message,
        });
      }
    }

    // Method 3: Search by name pattern
    if (productId.startsWith("prod_")) {
      try {
        const nameNumber = productId.replace("prod_", "");
        const searchName = `Product ${nameNumber}`;
        console.log(`🔍 Method 3: Name search for "${searchName}"`);
        product = await Product.findOne({
          $and: [
            { isActive: { $ne: false } },
            {
              $or: [
                { name: { $regex: searchName, $options: "i" } },
                { title: { $regex: searchName, $options: "i" } },
              ],
            },
          ],
        });
        searchMethods.push({
          method: "name_pattern",
          success: !!product,
          searchName,
        });
        if (product) {
          console.log(
            `✅ Found product via name pattern: ${
              product.name || product.title
            }`
          );

          if (product.viewCount !== undefined) {
            await Product.findByIdAndUpdate(product._id, {
              $inc: { viewCount: 1 },
            });
          }

          return res.json({
            success: true,
            data: product,
            searchMethod: "name_pattern",
          });
        }
      } catch (error) {
        console.log(`❌ Method 3 failed: ${error.message}`);
        searchMethods.push({
          method: "name_pattern",
          success: false,
          error: error.message,
        });
      }
    }

    // Method 4: List available products for debugging
    try {
      console.log(`🔍 Method 4: Listing available product IDs`);
      const allProducts = await Product.find(
        { isActive: { $ne: false } },
        { _id: 1, name: 1, title: 1 }
      ).limit(10);
      const productIds = allProducts.map((p) => ({
        id: p._id,
        name: p.name || p.title || "Unnamed Product",
      }));
      console.log("📋 Available product IDs:", productIds);
      searchMethods.push({
        method: "list_all",
        success: true,
        availableIds: productIds,
      });
    } catch (error) {
      console.log(`❌ Method 4 failed: ${error.message}`);
      searchMethods.push({
        method: "list_all",
        success: false,
        error: error.message,
      });
    }

    // No product found
    console.log(`❌ Product not found with ID: ${productId}`);

    return res.status(404).json({
      success: false,
      message: "Product not found",
      productId: productId,
      searchMethods: searchMethods,
      suggestion: "Check available product IDs or try browsing all products",
    });
  } catch (err) {
    console.error("❌ Error in product lookup:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      productId: req.params.id,
    });
  }
});

// ===== ADMIN ROUTES (CREATE, UPDATE, DELETE) =====

// @desc    Create new product (admin only)
// @route   POST /api/products
router.post("/", protect, admin, validateProductData, async (req, res) => {
  try {
    console.log("🛍️ Product creation by admin:", req.user.email);

    const productData = {
      ...req.body,
      createdBy: req.user._id,
      isActive: true,
      createdAt: new Date(),
    };

    const product = new Product(productData);
    await product.save();

    console.log("✅ Product created:", product.name || product.title);

    res.status(201).json({
      success: true,
      data: product,
      message: `Product "${
        product.name || product.title
      }" created successfully`,
    });
  } catch (error) {
    console.error("❌ Product creation error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
});

// @desc    Update product (admin only)
// @route   PUT /api/products/:id
router.put("/:id", protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(
      "🛍️ Product update by admin:",
      req.user.email,
      "for product:",
      req.params.id
    );

    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product updated:", product.name || product.title);

    res.json({
      success: true,
      data: product,
      message: `Product "${
        product.name || product.title
      }" updated successfully`,
    });
  } catch (error) {
    console.error("❌ Product update error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
});

// @desc    Delete product (admin only)
// @route   DELETE /api/products/:id
router.delete("/:id", protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(
      "🗑️ Product deletion by admin:",
      req.user.email,
      "for product:",
      req.params.id
    );

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const deletedProductInfo = {
      id: product._id,
      name: product.name || product.title,
      category: product.category,
      price: product.price,
    };

    await Product.findByIdAndDelete(req.params.id);

    console.log("✅ Product deleted:", deletedProductInfo.name);

    res.json({
      success: true,
      data: deletedProductInfo,
      message: `Product "${deletedProductInfo.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Product deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
});

module.exports = router;
