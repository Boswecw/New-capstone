// server/routes/admin.js - COMPLETE ADMIN ROUTES
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pet = require("../models/Pet");
const Contact = require("../models/Contact");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const { protect, admin } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");

// Helper function for async error handling
const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply admin middleware to all routes
router.use(protect, admin);

// ===== DASHBOARD ROUTE =====
// GET /api/admin/dashboard - Get dashboard statistics and data
router.get(
  "/dashboard",
  handleAsyncError(async (req, res) => {
    console.log("📊 Admin: Fetching dashboard data");

    try {
      // Get all statistics in parallel
      const [
        totalPets,
        availablePets,
        pendingPets,
        adoptedPets,
        totalUsers,
        activeUsers,
        totalContacts,
        newContacts,
        readContacts,
        totalProducts,
        inStockProducts,
        recentPets,
        recentUsers,
        recentContacts
      ] = await Promise.all([
        Pet.countDocuments(),
        Pet.countDocuments({ status: "available" }),
        Pet.countDocuments({ status: "pending" }),
        Pet.countDocuments({ status: "adopted" }),
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Contact.countDocuments(),
        Contact.countDocuments({ status: "new" }),
        Contact.countDocuments({ status: "read" }),
        Product.countDocuments(),
        Product.countDocuments({ inStock: true }),
        Pet.find().sort({ createdAt: -1 }).limit(5).select("name type breed status createdAt image"),
        User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt isActive"),
        Contact.find().sort({ createdAt: -1 }).limit(5).select("name email subject status createdAt")
      ]);

      const stats = {
        pets: {
          total: totalPets,
          available: availablePets,
          pending: pendingPets,
          adopted: adoptedPets
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        contacts: {
          total: totalContacts,
          new: newContacts,
          read: readContacts,
          resolved: totalContacts - newContacts - readContacts
        },
        products: {
          total: totalProducts,
          inStock: inStockProducts,
          outOfStock: totalProducts - inStockProducts
        }
      };

      const recentActivity = {
        pets: recentPets,
        users: recentUsers,
        contacts: recentContacts
      };

      res.json({
        success: true,
        data: {
          stats,
          recentActivity
        },
        message: "Dashboard data retrieved successfully",
      });
    } catch (error) {
      console.error("❌ Dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load dashboard data",
        error: error.message
      });
    }
  })
);

// ===== USER MANAGEMENT ROUTES =====
// GET /api/admin/users - Get all users with pagination and filtering
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

    if (role && role !== 'all') {
      query.role = role;
    }

    if (isActive !== undefined && isActive !== 'all') {
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
      .select("-password");

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

// PUT /api/admin/users/:id - Update user
router.put(
  "/users/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const { role, isActive, name, email } = req.body;
    
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user,
      message: "User updated successfully"
    });
  })
);

// DELETE /api/admin/users/:id - Delete user
router.delete(
  "/users/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
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

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { breed: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (age && age !== 'all') {
      query.age = age;
    }

    if (size && size !== 'all') {
      query.size = size;
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

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    console.log(`🔍 Found ${pets.length} pets (${totalPets} total)`);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: "Pets retrieved successfully",
    });
  })
);

// PUT /api/admin/pets/:id - Update pet
router.put(
  "/pets/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found"
      });
    }

    res.json({
      success: true,
      data: pet,
      message: "Pet updated successfully"
    });
  })
);

// DELETE /api/admin/pets/:id - Delete pet
router.delete(
  "/pets/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found"
      });
    }

    res.json({
      success: true,
      message: "Pet deleted successfully"
    });
  })
);

// ===== PRODUCT MANAGEMENT ROUTES =====
// GET /api/admin/products - Get all products for admin management
router.get(
  "/products",
  handleAsyncError(async (req, res) => {
    const {
      search,
      category,
      brand,
      inStock,
      limit = 20,
      page = 1,
      sort = "createdAt",
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (brand && brand !== 'all') {
      query.brand = brand;
    }

    if (inStock !== undefined && inStock !== 'all') {
      query.inStock = inStock === "true";
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
      case "price":
        sortOptions.price = 1;
        break;
      case "category":
        sortOptions.category = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: "Products retrieved successfully",
    });
  })
);

// POST /api/admin/products - Create new product
router.post(
  "/products",
  handleAsyncError(async (req, res) => {
    const product = new Product({
      ...req.body,
      createdBy: req.user._id
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully"
    });
  })
);

// PUT /api/admin/products/:id - Update product
router.put(
  "/products/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      data: product,
      message: "Product updated successfully"
    });
  })
);

// DELETE /api/admin/products/:id - Delete product
router.delete(
  "/products/:id",
  validateObjectId,
  handleAsyncError(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  })
);

// ===== CONTACT MANAGEMENT ROUTES =====
// GET /api/admin/contacts - Get all contacts with filtering
router.get(
  "/contacts",
  handleAsyncError(async (req, res) => {
    const {
      search,
      status,
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
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
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
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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

// ===== ANALYTICS ROUTES =====
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
      "1year": 365
    };
    
    const days = daysMap[range] || 30;
    const startDate = new Date(now - (days * 24 * 60 * 60 * 1000));

    try {
      // Get analytics data
      const [
        totalStats,
        periodStats,
        petStats,
        userStats,
        contactStats,
        productStats,
        recentActivity
      ] = await Promise.all([
        // Total stats
        Promise.all([
          Pet.countDocuments(),
          User.countDocuments(),
          Contact.countDocuments(),
          Product.countDocuments()
        ]),
        // Period stats
        Promise.all([
          Pet.countDocuments({ createdAt: { $gte: startDate } }),
          User.countDocuments({ createdAt: { $gte: startDate } }),
          Contact.countDocuments({ createdAt: { $gte: startDate } }),
          Product.countDocuments({ createdAt: { $gte: startDate } })
        ]),
        // Pet analytics
        Pet.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]),
        // User analytics
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 }
            }
          }
        ]),
        // Contact analytics
        Contact.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]),
        // Product analytics
        Product.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              totalValue: { $sum: "$price" }
            }
          }
        ]),
        // Recent activity
        {
          pets: Pet.find().sort({ createdAt: -1 }).limit(10).select("name type status createdAt"),
          users: User.find().sort({ createdAt: -1 }).limit(10).select("name email role createdAt"),
          contacts: Contact.find().sort({ createdAt: -1 }).limit(10).select("name email subject status createdAt")
        }
      ]);

      const [totalPets, totalUsers, totalContacts, totalProducts] = totalStats;
      const [newPets, newUsers, newContacts, newProducts] = periodStats;

      // Format analytics data
      const analytics = {
        overview: {
          totalPets,
          totalUsers,
          totalContacts,
          totalProducts,
          newPets,
          newUsers,
          newContacts,
          newProducts,
          period: range
        },
        chartData: {
          petsByStatus: petStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          usersByRole: userStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          contactsByStatus: contactStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          productsByCategory: productStats.map(item => ({
            category: item._id,
            count: item.count,
            value: item.totalValue
          }))
        },
        recentActivity
      };

      console.log("✅ Analytics data compiled successfully");

      res.json({
        success: true,
        data: analytics,
        message: "Analytics data retrieved successfully"
      });
    } catch (error) {
      console.error("❌ Analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics data",
        error: error.message
      });
    }
  })
);

// ===== SETTINGS ROUTES =====
// GET /api/admin/settings - Get system settings
router.get(
  "/settings",
  handleAsyncError(async (req, res) => {
    console.log("⚙️ Fetching system settings");

    try {
      // Try to get settings from database
      let settings = await Settings.findOne();

      if (!settings) {
        // Create default settings if none exist
        settings = new Settings({
          siteName: "FurBabies Pet Store",
          siteDescription: "Find your perfect pet companion",
          contactEmail: "info@furbabies.com",
          contactPhone: "(555) 123-4567",
          allowRegistration: true,
          requireEmailVerification: false,
          maxLoginAttempts: 5,
          defaultPetStatus: "available",
          maxPetImages: 5,
          petApprovalRequired: false,
          maintenanceMode: false,
          maxUploadSize: "5MB",
          sessionTimeout: "30",
          enableAnalytics: true,
          emailNotifications: true,
          notifyOnNewContact: true,
          notifyOnNewRegistration: false,
          notifyOnAdoption: true
        });
        
        await settings.save();
        console.log("✅ Created default settings");
      }

      res.json({
        success: true,
        data: settings,
        message: "Settings retrieved successfully"
      });
    } catch (error) {
      console.error("❌ Settings fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch settings",
        error: error.message
      });
    }
  })
);

// PUT /api/admin/settings - Update system settings
router.put(
  "/settings",
  handleAsyncError(async (req, res) => {
    console.log("⚙️ Updating system settings", req.body);

    try {
      let settings = await Settings.findOne();

      if (!settings) {
        // Create new settings if none exist
        settings = new Settings(req.body);
      } else {
        // Update existing settings
        Object.assign(settings, req.body);
        settings.updatedAt = new Date();
      }

      await settings.save();

      res.json({
        success: true,
        data: settings,
        message: "Settings updated successfully"
      });
    } catch (error) {
      console.error("❌ Settings update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update settings",
        error: error.message
      });
    }
  })
);

// ===== REPORTS ROUTES =====
// GET /api/admin/reports - Generate reports
router.get(
  "/reports",
  handleAsyncError(async (req, res) => {
    const { type = "all", period = "30days" } = req.query;
    console.log(`📋 Generating ${type} report for ${period}`);

    const now = new Date();
    const daysMap = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
    const days = daysMap[period] || 30;
    const startDate = new Date(now - (days * 24 * 60 * 60 * 1000));

    try {
      const reports = {};

      if (type === "all" || type === "pets") {
        reports.pets = await Pet.find({ createdAt: { $gte: startDate } })
          .sort({ createdAt: -1 })
          .select("name type breed status age size createdAt");
      }

      if (type === "all" || type === "users") {
        reports.users = await User.find({ createdAt: { $gte: startDate } })
          .sort({ createdAt: -1 })
          .select("name email role isActive createdAt");
      }

      if (type === "all" || type === "contacts") {
        reports.contacts = await Contact.find({ createdAt: { $gte: startDate } })
          .sort({ createdAt: -1 })
          .select("name email subject status createdAt");
      }

      if (type === "all" || type === "products") {
        reports.products = await Product.find({ createdAt: { $gte: startDate } })
          .sort({ createdAt: -1 })
          .select("name category brand price inStock createdAt");
      }

      res.json({
        success: true,
        data: {
          type,
          period,
          dateRange: { start: startDate, end: now },
          reports
        },
        message: "Reports generated successfully"
      });
    } catch (error) {
      console.error("❌ Reports error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate reports",
        error: error.message
      });
    }
  })
);

// ===== BATCH OPERATIONS =====
// POST /api/admin/batch/delete-pets - Batch delete pets
router.post(
  "/batch/delete-pets",
  handleAsyncError(async (req, res) => {
    const { petIds } = req.body;

    if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pet IDs array is required"
      });
    }

    const result = await Pet.deleteMany({ _id: { $in: petIds } });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} pets deleted successfully`
    });
  })
);

// POST /api/admin/batch/delete-users - Batch delete users
router.post(
  "/batch/delete-users",
  handleAsyncError(async (req, res) => {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required"
      });
    }

    const result = await User.deleteMany({ 
      _id: { $in: userIds },
      role: { $ne: "admin" } // Prevent deleting admin users
    });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} users deleted successfully`
    });
  })
);

module.exports = router;