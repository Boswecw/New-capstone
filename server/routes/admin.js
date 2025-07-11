// routes/admin.js - COMPLETE UPDATED VERSION
const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet");
const User = require("../models/User");
const Contact = require("../models/Contact");
const { protect, admin } = require("../middleware/auth");
const {
  validatePetCreation,
  validatePetUpdate,
  validateObjectId,
} = require("../middleware/validation");

// ===== MIDDLEWARE =====
// Ensure all admin routes are protected
router.use(protect);
router.use(admin);

// ===== UTILITY FUNCTIONS =====
const sanitizeUser = (user) => {
  const {
    password,
    passwordResetToken,
    passwordResetExpires,
    emailVerificationToken,
    emailVerificationExpires,
    loginAttempts,
    lockUntil,
    ...sanitizedUser
  } = user.toObject ? user.toObject() : user;
  return sanitizedUser;
};

// ===== TEST & DEBUG ROUTES =====
router.get('/test', (req, res) => {
  console.log('🧪 Admin routes test endpoint hit by:', req.user.email);
  res.json({
    success: true,
    message: 'Admin routes are working perfectly!',
    timestamp: new Date().toISOString(),
    route: '/api/admin/test',
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

router.get('/debug', (req, res) => {
  console.log('🐛 Admin debug endpoint hit by:', req.user.email);
  res.json({
    success: true,
    message: 'Admin routes debug information',
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    },
    availableRoutes: [
      'GET /api/admin/test',
      'GET /api/admin/debug',
      'GET /api/admin/dashboard',
      'GET /api/admin/users',
      'PUT /api/admin/users/:id/role',
      'PUT /api/admin/users/:id/status',
      'DELETE /api/admin/users/:id',
      'GET /api/admin/pets',
      'POST /api/admin/pets',
      'PUT /api/admin/pets/:id',
      'DELETE /api/admin/pets/:id',
      'GET /api/admin/contacts',
      'GET /api/admin/contacts/:id',
      'PUT /api/admin/contacts/:id/status',
      'PUT /api/admin/contacts/:id/respond',
      'DELETE /api/admin/contacts/:id'
    ]
  });
});

// ===== DASHBOARD ROUTES =====

// GET /api/admin/dashboard - Get dashboard statistics
router.get("/dashboard", async (req, res) => {
  try {
    console.log('📊 Dashboard request by admin:', req.user.email);

    // Get current date and 30 days ago for trend analysis
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
          adminUsers: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
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
          respondedContacts: {
            $sum: { $cond: [{ $eq: ["$status", "responded"] }, 1, 0] },
          },
          pendingContacts: {
            $sum: {
              $cond: [{ $in: ["$status", ["new", "read"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get recent activities
    const recentPets = await Pet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name type status createdAt")
      .populate("createdBy", "name email");

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt isActive");

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email subject status createdAt");

    // Get adoption trends (last 30 days)
    const adoptionTrends = await Pet.aggregate([
      {
        $match: {
          status: "adopted",
          adoptedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$adoptedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get pet category distribution
    const categoryDistribution = await Pet.aggregate([
      {
        $match: { status: "available" },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get pet type distribution
    const typeDistribution = await Pet.aggregate([
      {
        $match: { status: "available" },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

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
          adminUsers: 0,
          newUsersThisMonth: 0,
        },
        contacts: contactStats[0] || {
          totalContacts: 0,
          newContacts: 0,
          respondedContacts: 0,
          pendingContacts: 0,
        },
      },
      recentActivities: {
        pets: recentPets,
        users: recentUsers,
        contacts: recentContacts,
      },
      charts: {
        adoptionTrends,
        categoryDistribution: categoryDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      summary: {
        totalEntities: (petStats[0]?.totalPets || 0) + (userStats[0]?.totalUsers || 0) + (contactStats[0]?.totalContacts || 0),
        activeEntities: (petStats[0]?.availablePets || 0) + (userStats[0]?.activeUsers || 0),
        pendingActions: (petStats[0]?.pendingPets || 0) + (contactStats[0]?.pendingContacts || 0)
      }
    };

    console.log('✅ Dashboard data compiled for:', req.user.email);

    res.json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully",
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
});

// ===== USER MANAGEMENT ROUTES =====

// GET /api/admin/users - Get all users with pagination and filtering
router.get("/users", async (req, res) => {
  try {
    console.log('👥 Users list request by admin:', req.user.email);

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

    // Get role distribution for stats
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    console.log('✅ Users list compiled:', totalUsers, 'total users');

    res.json({
      success: true,
      data: users.map(user => sanitizeUser(user)),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: limitNum
      },
      stats: {
        roleDistribution: roleStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Users list error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put("/users/:id/role", validateObjectId, async (req, res) => {
  try {
    console.log('👑 Role update request by admin:', req.user.email, 'for user:', req.params.id);

    const { role } = req.body;

    // Validate role
    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, admin, moderator",
      });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin role"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log('✅ Role updated:', user.email, 'to', role);

    res.json({
      success: true,
      data: sanitizeUser(user),
      message: `User role updated to ${role} successfully`,
    });
  } catch (error) {
    console.error("❌ Role update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:id/status - Update user status
router.put("/users/:id/status", validateObjectId, async (req, res) => {
  try {
    console.log('🔄 Status update request by admin:', req.user.email, 'for user:', req.params.id);

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value"
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log('✅ Status updated:', user.email, 'to', isActive ? 'active' : 'inactive');

    res.json({
      success: true,
      data: sanitizeUser(user),
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("❌ Status update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message,
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", validateObjectId, async (req, res) => {
  try {
    console.log('🗑️ User deletion request by admin:', req.user.email, 'for user:', req.params.id);

    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Store user info for response
    const deletedUserInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    await User.findByIdAndDelete(req.params.id);

    console.log('✅ User deleted:', deletedUserInfo.email);

    res.json({
      success: true,
      data: deletedUserInfo,
      message: `User ${deletedUserInfo.name} (${deletedUserInfo.email}) deleted successfully`,
    });
  } catch (error) {
    console.error("❌ User deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// ===== PET MANAGEMENT ROUTES =====

// GET /api/admin/pets - Get all pets for admin management
router.get("/pets", async (req, res) => {
  try {
    console.log("🐕 Admin pets route hit with query:", req.query);

    const {
      search,
      category,
      type,
      breed,
      status,
      available,
      age,
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

    if (category) query.category = category;
    if (type) query.type = type;
    if (breed) query.breed = { $regex: breed, $options: "i" };
    if (status) query.status = status;
    if (available !== undefined && available !== "") {
      query.available = available === "true";
    }
    if (age) query.age = parseInt(age);

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
      case "status":
        sortOptions.status = 1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log("🔍 MongoDB query:", query);

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate("createdBy", "name email")
      .populate("adoptedBy", "name email");

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    // Get status distribution for stats
    const statusStats = await Pet.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    console.log("✅ Admin found pets:", totalPets);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: limitNum
      },
      stats: {
        statusDistribution: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      message: "Pets retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching pets for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
});

// POST /api/admin/pets - Add new pet
router.post("/pets", validatePetCreation, async (req, res) => {
  try {
    console.log('🐕 New pet creation by admin:', req.user.email);

    const petData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const pet = new Pet(petData);
    await pet.save();

    // Populate creator info
    await pet.populate("createdBy", "name email");

    console.log('✅ Pet created:', pet.name, 'by', req.user.email);

    res.status(201).json({
      success: true,
      data: pet,
      message: `Pet ${pet.name} added successfully`,
    });
  } catch (error) {
    console.error("❌ Pet creation error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Error adding pet",
      error: error.message,
    });
  }
});

// PUT /api/admin/pets/:id - Update pet
router.put("/pets/:id", validateObjectId, validatePetUpdate, async (req, res) => {
  try {
    console.log('🐕 Pet update by admin:', req.user.email, 'for pet:', req.params.id);

    const pet = await Pet.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy", "name email")
     .populate("adoptedBy", "name email");

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    console.log('✅ Pet updated:', pet.name);

    res.json({
      success: true,
      data: pet,
      message: `Pet ${pet.name} updated successfully`,
    });
  } catch (error) {
    console.error("❌ Pet update error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating pet",
      error: error.message,
    });
  }
});

// DELETE /api/admin/pets/:id - Delete pet
router.delete("/pets/:id", validateObjectId, async (req, res) => {
  try {
    console.log('🗑️ Pet deletion by admin:', req.user.email, 'for pet:', req.params.id);

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    const deletedPetInfo = {
      id: pet._id,
      name: pet.name,
      type: pet.type,
      status: pet.status
    };

    await Pet.findByIdAndDelete(req.params.id);

    console.log('✅ Pet deleted:', deletedPetInfo.name);

    res.json({
      success: true,
      data: deletedPetInfo,
      message: `Pet ${deletedPetInfo.name} deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Pet deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting pet",
      error: error.message,
    });
  }
});

// ===== CONTACT MANAGEMENT ROUTES =====

// GET /api/admin/contacts - Get all contacts for admin
router.get("/contacts", async (req, res) => {
  try {
    console.log('📧 Contacts list request by admin:', req.user.email);

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
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
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

    // Execute query
    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate("response.respondedBy", "name email");

    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limitNum);

    // Get status counts for stats
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('✅ Contacts list compiled:', totalContacts, 'total contacts');

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: limitNum
      },
      stats: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      message: "Contact submissions retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Contacts list error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
      error: error.message,
    });
  }
});

// GET /api/admin/contacts/:id - Get single contact submission
router.get("/contacts/:id", validateObjectId, async (req, res) => {
  try {
    console.log('📧 Contact details request by admin:', req.user.email, 'for contact:', req.params.id);

    const contact = await Contact.findById(req.params.id).populate(
      "response.respondedBy",
      "name email"
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    // Mark as read if it's new
    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
      console.log('📖 Contact marked as read:', contact._id);
    }

    res.json({
      success: true,
      data: contact,
      message: "Contact submission retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Contact details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contact",
      error: error.message,
    });
  }
});

// PUT /api/admin/contacts/:id/status - Update contact status
router.put("/contacts/:id/status", validateObjectId, async (req, res) => {
  try {
    console.log('📧 Contact status update by admin:', req.user.email, 'for contact:', req.params.id);

    const { status } = req.body;

    // Validate status
    const validStatuses = ["new", "read", "responded", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: new, read, responded, resolved",
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    contact.status = status;
    await contact.save();

    console.log('✅ Contact status updated:', contact._id, 'to', status);

    res.json({
      success: true,
      data: contact,
      message: `Contact status updated to ${status} successfully`,
    });
  } catch (error) {
    console.error("❌ Contact status update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating contact status",
      error: error.message,
    });
  }
});

// PUT /api/admin/contacts/:id/respond - Add response to contact
router.put("/contacts/:id/respond", validateObjectId, async (req, res) => {
  try {
    console.log('📧 Contact response by admin:', req.user.email, 'for contact:', req.params.id);

    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Response message is required",
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    // Add response
    contact.response = {
      message: message.trim(),
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };

    // Update status to responded
    contact.status = "responded";
    await contact.save();

    // Populate the response
    await contact.populate("response.respondedBy", "name email");

    console.log('✅ Response added to contact:', contact._id);

    res.json({
      success: true,
      data: contact,
      message: "Response added successfully",
    });
  } catch (error) {
    console.error("❌ Contact response error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding response",
      error: error.message,
    });
  }
});

// DELETE /api/admin/contacts/:id - Delete contact submission
router.delete("/contacts/:id", validateObjectId, async (req, res) => {
  try {
    console.log('🗑️ Contact deletion by admin:', req.user.email, 'for contact:', req.params.id);

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    const deletedContactInfo = {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      status: contact.status
    };

    await Contact.findByIdAndDelete(req.params.id);

    console.log('✅ Contact deleted:', deletedContactInfo.id);

    res.json({
      success: true,
      data: deletedContactInfo,
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    console.error("❌ Contact deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting contact",
      error: error.message,
    });
  }
});

// ===== BULK OPERATIONS =====

// POST /api/admin/bulk/pets/status - Bulk update pet status
router.post("/bulk/pets/status", async (req, res) => {
  try {
    console.log('🔄 Bulk pet status update by admin:', req.user.email);

    const { petIds, status } = req.body;

    if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pet IDs array is required"
      });
    }

    const validStatuses = ["available", "adopted", "pending", "unavailable"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: available, adopted, pending, unavailable"
      });
    }

    const result = await Pet.updateMany(
      { _id: { $in: petIds } },
      { $set: { status } }
    );

    console.log('✅ Bulk update completed:', result.modifiedCount, 'pets updated');

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        status: status
      },
      message: `${result.modifiedCount} pets updated to ${status} status`
    });
  } catch (error) {
    console.error("❌ Bulk pet status update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating pet statuses",
      error: error.message
    });
  }
});

// POST /api/admin/bulk/users/status - Bulk update user status
router.post("/bulk/users/status", async (req, res) => {
  try {
    console.log('🔄 Bulk user status update by admin:', req.user.email);

    const { userIds, isActive } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required"
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value"
      });
    }

    // Prevent admin from deactivating themselves
    if (userIds.includes(req.user._id.toString()) && !isActive) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account"
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive } }
    );

    console.log('✅ Bulk user update completed:', result.modifiedCount, 'users updated');

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        isActive: isActive
      },
      message: `${result.modifiedCount} users ${isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error("❌ Bulk user status update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user statuses",
      error: error.message
    });
  }
});

module.exports = router;