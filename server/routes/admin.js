// server/routes/admin.js - COMPLETE UPDATED VERSION
const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet");
const User = require("../models/User");
const Contact = require("../models/Contact");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/auth");
const {
  validatePetCreation,
  validatePetUpdate,
  validateObjectId,
} = require("../middleware/validation");

// Middleware to ensure all admin routes are protected
router.use(protect);
router.use(admin);

// ===== UTILITY FUNCTIONS =====
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ===== DASHBOARD ROUTE =====
// GET /api/admin/dashboard - Get dashboard statistics
router.get(
  "/dashboard",
  handleAsyncError(async (req, res) => {
    console.log("📊 Admin dashboard requested");

    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get pet statistics
    const petStats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          availablePets: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
          },
          adoptedPets: {
            $sum: { $cond: [{ $eq: ["$status", "adopted"] }, 1, 0] },
          },
          pendingPets: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          newUsersThisMonth: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get contact statistics
    const contactStats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          newContacts: {
            $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
          },
          pendingContacts: {
            $sum: {
              $cond: [{ $in: ["$status", ["new", "read"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get product statistics
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockProducts: {
            $sum: { $cond: [{ $eq: ["$inStock", true] }, 1, 0] },
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ["$inStock", false] }, 1, 0] },
          },
        },
      },
    ]);

    // Get recent activities
    const recentPets = await Pet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name type status createdAt");
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email subject status createdAt");
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt");

    // Compile dashboard data
    const dashboardData = {
      stats: {
        pets: petStats[0] || {
          totalPets: 0,
          availablePets: 0,
          adoptedPets: 0,
          pendingPets: 0,
        },
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          newUsersThisMonth: 0,
        },
        contacts: contactStats[0] || {
          totalContacts: 0,
          newContacts: 0,
          pendingContacts: 0,
        },
        products: productStats[0] || {
          totalProducts: 0,
          inStockProducts: 0,
          outOfStockProducts: 0,
        },
      },
      recentActivities: {
        pets: recentPets,
        contacts: recentContacts,
        users: recentUsers,
      },
      systemInfo: {
        environment: process.env.NODE_ENV,
        timestamp: now.toISOString(),
        uptime: process.uptime(),
      },
    };

    console.log("✅ Dashboard data compiled successfully");

    res.json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully",
    });
  })
);

// ===== USER MANAGEMENT ROUTES =====
// GET /api/admin/users - Get all users with pagination
router.get(
  "/users",
  handleAsyncError(async (req, res) => {
    const {
      search,
      role,
      isActive,
      limit = 20,
      page = 1,
      sort = "createdAt",
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case "name":
        sortOptions.name = 1;
        break;
      case "email":
        sortOptions.email = 1;
        break;
      case "role":
        sortOptions.role = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .select("-password")
      .populate("adoptedPets.pet", "name type breed");

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: "Users retrieved successfully",
    });
  })
);

// ===== PET MANAGEMENT ROUTES =====
// GET /api/admin/pets - Get all pets for admin management
router.get(
  "/pets",
  handleAsyncError(async (req, res) => {
    console.log("🔍 Admin pets route hit with query:", req.query);

    const {
      search,
      type,
      status,
      age,
      size,
      limit = 20,
      page = 1,
      sort = "createdAt",
    } = req.query;

    // Build query object
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { breed: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (size && size !== "all") {
      query.size = size;
    }

    if (age) {
      const ageRange = age.split("-");
      if (ageRange.length === 2) {
        query.age = {
          $gte: parseInt(ageRange[0]),
          $lte: parseInt(ageRange[1]),
        };
      }
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case "name":
        sortOptions.name = 1;
        break;
      case "age":
        sortOptions.age = 1;
        break;
      case "type":
        sortOptions.type = 1;
        break;
      case "status":
        sortOptions.status = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log("🐕 MongoDB query:", query);

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate("createdBy", "name email");

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    console.log("✅ Found pets:", totalPets);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        total: totalPets,
        pages: totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
      message: "Pets retrieved successfully",
    });
  })
);

// POST /api/admin/pets - Add new pet
router.post(
  "/pets",
  validatePetCreation,
  handleAsyncError(async (req, res) => {
    console.log("🐕 Creating new pet:", req.body);

    const petData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const pet = new Pet(petData);
    await pet.save();

    console.log("✅ Pet created successfully:", pet._id);

    res.status(201).json({
      success: true,
      data: pet,
      message: "Pet created successfully",
    });
  })
);

// PUT /api/admin/pets/:id - Update pet
router.put(
  "/pets/:id",
  validateObjectId,
  validatePetUpdate,
  handleAsyncError(async (req, res) => {
    console.log("🐕 Updating pet:", req.params.id);

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    console.log("✅ Pet updated successfully");

    res.json({
      success: true,
      data: pet,
      message: "Pet updated successfully",
    });
  })
);

// DELETE /api/admin/pets/:id - Delete pet
router.delete(
  "/pets/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    console.log("🐕 Deleting pet:", req.params.id);

    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    console.log("✅ Pet deleted successfully");

    res.json({
      success: true,
      message: "Pet deleted successfully",
    });
  })
);

// ===== PRODUCT MANAGEMENT ROUTES (FIXED) =====
// GET /api/admin/products - Get all products with enhanced error handling
router.get(
  "/products",
  handleAsyncError(async (req, res) => {
    const {
      search,
      category,
      brand,
      inStock,
      minPrice,
      maxPrice,
      limit = 20,
      page = 1,
      sort = "createdAt",
    } = req.query;

    console.log("🛒 Admin fetching products with filters:", req.query);

    // Build query object with validation
    const query = {};

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { brand: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category.toLowerCase();
    }

    if (brand && brand !== "all") {
      query.brand = brand;
    }

    if (inStock !== undefined && inStock !== "all") {
      query.inStock = inStock === "true";
    }

    // Price range filtering with validation
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    // Pagination with validation
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // Sort options with validation
    const sortOptions = {};
    switch (sort) {
      case "name":
        sortOptions.name = 1;
        break;
      case "price_asc":
        sortOptions.price = 1;
        break;
      case "price_desc":
        sortOptions.price = -1;
        break;
      case "category":
        sortOptions.category = 1;
        break;
      case "brand":
        sortOptions.brand = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));

    // Execute queries with error handling
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .limit(limitNum)
        .skip(skip)
        .populate("createdBy", "name email")
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    console.log(
      `✅ Found ${totalProducts} products, returning page ${pageNum}/${totalPages}`
    );

    // Enhance products with additional fields
    const enhancedProducts = products.map((product) => ({
      ...product,
      imageUrl: product.image
        ? `https://storage.googleapis.com/furbabies-petstore/${encodeURIComponent(product.image)}`
        : null,
      fallbackImageUrl: "/api/images/fallback/product",
      priceFormatted: `$${product.price.toFixed(2)}`,
      createdByName: product.createdBy?.name || "Unknown",
    }));

    res.json({
      success: true,
      data: enhancedProducts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        total: totalProducts,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum,
      },
      filters: {
        search: search || "",
        category: category || "all",
        brand: brand || "all",
        inStock: inStock || "all",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        sort,
      },
      message: `Found ${totalProducts} products`,
    });
  })
);

// POST /api/admin/products - Add new product
router.post(
  "/products",
  handleAsyncError(async (req, res) => {
    console.log("🛒 Creating new product:", req.body);

    const productData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const product = new Product(productData);
    await product.save();

    console.log("✅ Product created successfully:", product._id);

    res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  })
);

// PUT /api/admin/products/:id - Update product
router.put(
  "/products/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    console.log("🛒 Updating product:", req.params.id);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product updated successfully");

    res.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  })
);

// DELETE /api/admin/products/:id - Delete product
router.delete(
  "/products/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    console.log("🛒 Deleting product:", req.params.id);

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product deleted successfully");

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  })
);

// GET /api/admin/products/stats - Get product statistics
router.get(
  "/products/stats",
  handleAsyncError(async (req, res) => {
    console.log("📊 Fetching product statistics...");

    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ inStock: true });
    const outOfStockProducts = await Product.countDocuments({ inStock: false });

    // Category breakdown
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Brand breakdown
    const brandStats = await Product.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Price ranges
    const priceRanges = await Product.aggregate([
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 25, 50, 100, 1000],
          default: "over1000",
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          inStockProducts,
          outOfStockProducts,
          stockPercentage:
            totalProducts > 0
              ? ((inStockProducts / totalProducts) * 100).toFixed(1)
              : 0,
        },
        categories: categoryStats,
        brands: brandStats,
        priceRanges,
      },
      message: "Product statistics retrieved successfully",
    });
  })
);

// ===== CONTACT MANAGEMENT ROUTES =====
// GET /api/admin/contacts - Get all contacts
router.get(
  "/contacts",
  handleAsyncError(async (req, res) => {
    const {
      status,
      search,
      limit = 20,
      page = 1,
      sort = "createdAt",
    } = req.query;

    // Build query object
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case "name":
        sortOptions.name = 1;
        break;
      case "email":
        sortOptions.email = 1;
        break;
      case "status":
        sortOptions.status = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limitNum);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: "Contacts retrieved successfully",
    });
  })
);

// PUT /api/admin/contacts/:id - Update contact status
router.put(
  "/contacts/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      data: contact,
      message: "Contact updated successfully",
    });
  })
);

// DELETE /api/admin/contacts/:id - Delete contact
router.delete(
  "/contacts/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  })
);

// ===== ANALYTICS ROUTE (NEW - FIXES SPINNING ISSUE) =====
// GET /api/admin/analytics - Get analytics data
router.get(
  "/analytics",
  handleAsyncError(async (req, res) => {
    const { range = "30days" } = req.query;
    console.log("📊 Fetching analytics for range:", range);

    // Calculate date range
    const now = new Date();
    const daysMap = {
      "7days": 7,
      "30days": 30,
      "90days": 90,
      "1year": 365,
    };
    const days = daysMap[range] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overview statistics
    const totalPets = await Pet.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();

    // Get pets by status
    const petsAvailable = await Pet.countDocuments({ status: "available" });
    const petsAdopted = await Pet.countDocuments({ status: "adopted" });

    // Get recent activity
    const recentPets = await Pet.countDocuments({
      createdAt: { $gte: startDate },
    });
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: startDate },
    });
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: startDate },
    });

    // Generate daily activity data for charts
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayContacts = await Contact.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      chartData.push({
        date: dayStart.toISOString().split("T")[0],
        contacts: dayContacts,
        visits: Math.floor(Math.random() * 100) + 50, // Mock data
        adoptions: Math.floor(Math.random() * 5), // Mock data
      });
    }

    // Category breakdown
    const petCategories = await Pet.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Top performing pages (mock data)
    const topPages = [
      {
        page: "/pets",
        visits: Math.floor(Math.random() * 1000) + 500,
        bounceRate: "25%",
      },
      {
        page: "/browse",
        visits: Math.floor(Math.random() * 800) + 400,
        bounceRate: "20%",
      },
      {
        page: "/products",
        visits: Math.floor(Math.random() * 600) + 300,
        bounceRate: "30%",
      },
      {
        page: "/about",
        visits: Math.floor(Math.random() * 400) + 200,
        bounceRate: "35%",
      },
      {
        page: "/contact",
        visits: Math.floor(Math.random() * 300) + 100,
        bounceRate: "15%",
      },
    ];

    // User flow (mock data based on real stats)
    const userFlow = [
      { step: "Homepage Visit", users: totalUsers, percentage: "100%" },
      {
        step: "Browse Pets",
        users: Math.floor(totalUsers * 0.75),
        percentage: "75%",
      },
      {
        step: "View Pet Details",
        users: Math.floor(totalUsers * 0.45),
        percentage: "45%",
      },
      {
        step: "Contact/Apply",
        users: totalContacts,
        percentage: `${
          totalUsers > 0 ? Math.floor((totalContacts / totalUsers) * 100) : 0
        }%`,
      },
      {
        step: "Successful Adoption",
        users: petsAdopted,
        percentage: `${
          totalUsers > 0 ? Math.floor((petsAdopted / totalUsers) * 100) : 0
        }%`,
      },
    ];

    const analyticsData = {
      overview: {
        totalVisits: totalUsers * 25, // Estimate
        uniqueVisitors: totalUsers,
        adoptionInquiries: totalContacts,
        successfulAdoptions: petsAdopted,
        conversionRate:
          totalContacts > 0
            ? ((petsAdopted / totalContacts) * 100).toFixed(1)
            : "0.0",
        recentActivity: {
          pets: recentPets,
          products: recentProducts,
          contacts: recentContacts,
        },
      },
      chartData: {
        daily: chartData,
        petCategories: petCategories.map((cat) => ({
          category: cat._id || "Unknown",
          count: cat.count,
        })),
        productCategories: productCategories.map((cat) => ({
          category: cat._id || "Unknown",
          count: cat.count,
        })),
      },
      topPages,
      userFlow,
      recentActivity: [
        { action: "New pet added", time: "2 hours ago", type: "pets" },
        { action: "Contact received", time: "4 hours ago", type: "contacts" },
        { action: "Product updated", time: "6 hours ago", type: "products" },
        { action: "User registered", time: "8 hours ago", type: "users" },
      ],
    };

    res.json({
      success: true,
      data: analyticsData,
      message: `Analytics data for ${range} retrieved successfully`,
    });
  })
);

// ===== REPORTS ROUTE =====
// GET /api/admin/reports - Generate various reports
router.get(
  "/reports",
  handleAsyncError(async (req, res) => {
    const { type = "summary", startDate, endDate } = req.query;

    // Set date range
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    switch (type) {
      case "pets":
        reportData = await Pet.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              pets: {
                $push: { name: "$name", type: "$type", breed: "$breed" },
              },
            },
          },
        ]);
        break;

      case "adoptions":
        reportData = await Pet.find({
          status: "adopted",
          updatedAt: { $gte: start, $lte: end },
        }).select("name type breed adoptionDate");
        break;

      case "contacts":
        reportData = await Contact.find({
          createdAt: { $gte: start, $lte: end },
        }).select("name email subject status createdAt");
        break;

      default:
        // Summary report
        const petStats = await Pet.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const userStats = await User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);
        const contactStats = await Contact.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        reportData = {
          pets: petStats,
          users: userStats,
          contacts: contactStats,
          period: { start, end },
        };
    }

    res.json({
      success: true,
      data: reportData,
      message: `${type} report generated successfully`,
    });
  })
);

// ===== ERROR HANDLING MIDDLEWARE =====
const adminErrorHandler = (err, req, res, next) => {
  console.error("❌ Admin route error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    timestamp: new Date().toISOString(),
  });
};

// Apply error handling middleware
router.use(adminErrorHandler);

module.exports = router;
