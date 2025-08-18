// server/routes/products.js - COMPLETE FILE WITH OBJECTID CASTING FIX (resolved)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/auth"); // optionalAuth removed (unused)

// ===== HELPER FUNCTIONS =====
const addImageUrl = (product) => {
  if (!product) return product;

  return {
    ...product,
    imageUrl: product.image
      ? `https://storage.googleapis.com/furbabies-petstore/${product.image}`
      : null,
    hasImage: !!product.image,
    displayName: product.name || product.title || "Unnamed Product",
    isInStock: product.inStock !== false,
    stockStatus: product.inStock === false ? "Out of Stock" : "In Stock",
  };
};

// ✅ ADVANCED FILTER MAPPING for PRODUCTS
// Handles featured+search combination nicely; used as a base in GET /
const mapProductFiltersToQuery = (filters) => {
  // By default only show in-stock products unless explicitly filtered
  const query = {};
  const orConditions = [];

  // FEATURED filtering - Handle both boolean and string
  if (filters.featured === "true" || filters.featured === true) {
    orConditions.push([{ featured: true }, { featured: "true" }]);
  }

  // CATEGORY mapping
  if (filters.category && filters.category !== "all") {
    switch (String(filters.category).toLowerCase()) {
      case "food":
        query.category = new RegExp("(dog care|cat care)", "i");
        query.name = new RegExp("(food|kibble)", "i");
        break;
      case "toys":
        query.name = new RegExp("toy", "i");
        break;
      case "accessories":
        query.category = new RegExp("(dog care|cat care)", "i");
        query.name = new RegExp("(harness|leash|collar|bed)", "i");
        break;
      case "health":
        query.category = new RegExp("(grooming|health)", "i");
        break;
      case "aquarium":
        query.category = new RegExp("aquarium", "i");
        break;
      default:
        query.category = new RegExp(filters.category, "i");
    }
  }

  // BRAND filtering
  if (filters.brand && filters.brand !== "all") {
    query.brand = new RegExp(filters.brand, "i");
  }

  // PRICE RANGE filtering (e.g., "0-25", "50-100", "100+")
  if (filters.priceRange && filters.priceRange !== "all") {
    const [min, maxRaw] = String(filters.priceRange)
      .split("-")
      .map((p) => String(p || "").replace("+", ""));
    const minNum = parseFloat(min);
    const maxNum = maxRaw ? parseFloat(maxRaw) : null;
    if (!Number.isNaN(minNum) && maxNum !== null && !Number.isNaN(maxNum)) {
      query.price = { $gte: minNum, $lte: maxNum };
    } else if (!Number.isNaN(minNum)) {
      query.price = { $gte: minNum };
    }
  }

  // SEARCH across multiple fields
  if (filters.search && String(filters.search).trim()) {
    const searchRegex = new RegExp(String(filters.search).trim(), "i");
    orConditions.push([
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ]);
  }

  if (orConditions.length === 1) {
    query.$or = orConditions[0];
  } else if (orConditions.length > 1) {
    query.$and = orConditions.map((cond) => ({ $or: cond }));
  }

  return query;
};

// ===== VALIDATION FUNCTIONS =====
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

// ===== METADATA ROUTES (Must come before /:id route) =====

// @desc Get product categories
// @route GET /api/products/meta/categories
// @access Public
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category });
        return { name: category, count };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
        .filter((cat) => cat.count > 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

// @desc Get product brands
// @route GET /api/products/meta/brands
// @access Public
router.get("/meta/brands", async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const count = await Product.countDocuments({ brand });
        return { name: brand, count };
      })
    );

    res.json({
      success: true,
      data: brandsWithCount
        .filter((b) => b.count > 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    });
  } catch (error) {
    console.error("❌ Error fetching brands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
      error: error.message,
    });
  }
});

// @desc Get featured products
// @route GET /api/products/featured
// @access Public
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const productsWithImages = products.map((p) => addImageUrl(p));

    res.json({
      success: true,
      data: productsWithImages,
    });
  } catch (error) {
    console.error("❌ Error fetching featured products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message,
    });
  }
});

// ===== MAIN ROUTES =====

// @desc Get all products with advanced filtering
// @route GET /api/products
// @access Public
router.get("/", async (req, res) => {
  try {
    // Build base query from advanced mapper
    const query = mapProductFiltersToQuery(req.query);

    // Additional explicit filters (maintains backwards compatibility with your UI)
    const {
      category,
      brand,
      inStock,
      minPrice,
      maxPrice,
      search, // already handled by mapper; keeping for logs
      featured, // already handled
      page = 1,
      limit = 12,
      sort = "newest",
    } = req.query;

    // Explicit category (exact)
    if (category && category !== "all") {
      query.category = category;
    }

    // Explicit brand (case-insensitive)
    if (brand && brand !== "all") {
      query.brand = { $regex: brand, $options: "i" };
    }

    // Stock filter (overrides default behavior)
    if (inStock === "true") query.inStock = true;
    else if (inStock === "false") query.inStock = false;

    // Price range via min/max
    if (minPrice || maxPrice) {
      query.price = query.price || {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOptions = { createdAt: -1 }; // default newest first
    switch (sort) {
      case "price_asc":
        sortOptions = { price: 1 };
        break;
      case "price_desc":
        sortOptions = { price: -1 };
        break;
      case "name_asc":
        sortOptions = { name: 1 };
        break;
      case "name_desc":
        sortOptions = { name: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "featured":
        sortOptions = { featured: -1, createdAt: -1 };
        break;
      case "popular":
        sortOptions = { ratingCount: -1, rating: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const productsWithImages = products.map((p) => addImageUrl(p));

    res.json({
      success: true,
      data: productsWithImages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + products.length < total,
      },
      filters: {
        category: category || "all",
        brand: brand || "all",
        inStock: inStock || "all",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        search: search || "",
        featured: featured || "all",
        sort: sort || "newest",
      },
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
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

    if (!productId || productId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        received: productId,
      });
    }

    // ✅ Use native Mongo driver to bypass Mongoose ObjectId casting
    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    const product = await productsCollection.findOne({ _id: productId });

    if (!product) {
      // Provide a little debug help (limited sample)
      const allProducts = await productsCollection
        .find({}, { projection: { _id: 1, name: 1 } })
        .limit(20)
        .toArray();

      return res.status(404).json({
        success: false,
        message: `Product ${productId} not found`,
        searchedId: productId,
        availableIds: allProducts.map((p) => p._id).slice(0, 10),
      });
    }

    const productWithImage = addImageUrl(product);

    res.json({
      success: true,
      data: productWithImage,
    });
  } catch (error) {
    console.error(`❌ ERROR FINDING PRODUCT ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ===== ADMIN ROUTES (Protected) =====

// @desc Create new product (Admin only)
// @route POST /api/products
// @access Private/Admin
router.post("/", protect, admin, validateProductData, async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      title: req.body.title || req.body.name,
      category: req.body.category,
      brand: req.body.brand || "Generic",
      price: parseFloat(req.body.price),
      description: req.body.description || "",
      image: req.body.image || "",
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      featured: req.body.featured || false,
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    const product = new Product(productData);
    await product.save();

    const productWithImage = addImageUrl(product.toObject());

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: productWithImage,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
});

// @desc Update product (Admin only)
// @route PUT /api/products/:id
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.price !== undefined) {
      updateData.price = parseFloat(req.body.price);
    }

    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

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

    const productWithImage = addImageUrl(product.toObject());

    res.json({
      success: true,
      message: "Product updated successfully",
      data: productWithImage,
    });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// @desc Delete product (Admin only)
// @route DELETE /api/products/:id
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// @desc Toggle product stock status (Admin only)
// @route PATCH /api/products/:id/toggle-stock
// @access Private/Admin
router.patch("/:id/toggle-stock", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.inStock = !product.inStock;
    product.updatedBy = req.user._id;
    product.updatedAt = new Date();
    await product.save();

    const productWithImage = addImageUrl(product.toObject());

    res.json({
      success: true,
      message: `Product marked as ${product.inStock ? "in stock" : "out of stock"}`,
      data: productWithImage,
    });
  } catch (error) {
    console.error("❌ Error toggling product stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle product stock",
      error: error.message,
    });
  }
});

module.exports = router;
