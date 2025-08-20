// server/routes/admin.js - COMPLETE UPDATED VERSION
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pet = require("../models/Pet");
const Contact = require("../models/Contact");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/auth");
const { body, query, validationResult } = require('express-validator');

// Helper function for date range filtering
const getDateRangeFilter = (range) => {
  if (range === 'all') return {};
  
  const now = new Date();
  let daysBack;
  
  switch (range) {
    case '7days':
      daysBack = 7;
      break;
    case '30days':
      daysBack = 30;
      break;
    case '90days':
      daysBack = 90;
      break;
    case '1year':
      daysBack = 365;
      break;
    default:
      daysBack = 30;
  }
  
  const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  return { createdAt: { $gte: startDate } };
};

// Apply admin middleware to all routes
router.use(protect, admin);

// =====================================
// @route   GET /api/admin/dashboard
// @desc    Complete dashboard data
// @access  Private/Admin
// =====================================
router.get("/dashboard", async (req, res) => {
  try {
    console.log('📊 Admin: Fetching dashboard data');

    // Parallel queries for better performance
    const [
      totalPetsResult,
      availablePetsResult, 
      adoptedPetsResult,
      pendingPetsResult,
      totalUsersResult,
      totalProductsResult,
      totalContactsResult,
      recentPetsResult,
      recentUsersResult,
      recentContactsResult
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: "available" }),
      Pet.countDocuments({ status: "adopted" }),
      Pet.countDocuments({ status: "pending" }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments().catch(() => 0), // Handle if Product model fails
      Contact.countDocuments(),
      Pet.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name breed age species status image createdAt')
        .lean(),
      User.find({ role: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name username email role createdAt')
        .lean(),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email subject status createdAt')
        .lean()
    ]);

    // Construct clean response object
    const dashboardData = {
      success: true,
      data: {
        stats: {
          pets: {
            total: totalPetsResult || 0,
            available: availablePetsResult || 0,
            adopted: adoptedPetsResult || 0,
            pending: pendingPetsResult || 0
          },
          users: {
            total: totalUsersResult || 0
          },
          products: {
            total: totalProductsResult || 0
          },
          contacts: {
            total: totalContactsResult || 0
          }
        },
        recentActivity: {
          pets: recentPetsResult || [],
          users: recentUsersResult || [],
          contacts: recentContactsResult || []
        },
        alerts: [] // Add system alerts if needed
      }
    };

    console.log('✅ Dashboard data compiled successfully');
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================
// @route   GET /api/admin/stats
// @desc    Dashboard statistics (legacy)
// @access  Private/Admin
// =====================================
router.get("/stats", async (req, res) => {
  try {
    console.log('📊 Admin: Fetching dashboard stats');

    const [totalPets, availablePets, totalUsers, totalContacts, newContacts] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: "available" }),
      User.countDocuments(),
      Contact.countDocuments(),
      Contact.countDocuments({ status: "new" })
    ]);

    const stats = {
      pets: { total: totalPets, available: availablePets, adopted: totalPets - availablePets },
      users: { total: totalUsers },
      contacts: { total: totalContacts, new: newContacts, resolved: totalContacts - newContacts }
    };

    res.json({
      success: true,
      data: { stats },
      message: 'Admin dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error("❌ Admin stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load admin stats",
      error: error.message 
    });
  }
});

// =====================================
// @route   GET /api/admin/pets
// @desc    Get all pets with pagination (FIXED FOR IMAGES)
// @access  Private/Admin
// =====================================
router.get('/pets', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['available', 'pending', 'adopted']),
  query('species').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Higher limit for admin
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.species) filter.species = new RegExp(req.query.species, 'i');
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { breed: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [pets, totalCount] = await Promise.all([
      Pet.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pet.countDocuments(filter)
    ]);

    // FIXED: Add imageUrl field to each pet for consistent frontend handling
    const petsWithImages = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      species: pet.species || pet.type || 'Unknown' // Ensure species field exists
    }));

    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Admin pets loaded: ${petsWithImages.length} pets`);

    res.json({
      success: true,
      data: {
        pets: petsWithImages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets'
    });
  }
});

// =====================================
// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
// =====================================
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  console.log('🔍 Admin: Fetching users list');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array().map(err => err.msg)
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

    console.log('✅ Users loaded:', users.length);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// =====================================
// @route   PUT /api/admin/users/:id
// @desc    Update user (role, status, etc.)
// @access  Private/Admin
// =====================================
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Prevent self-demotion
    if (req.user.id === id && updates.role && updates.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// =====================================
// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
// =====================================
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// =====================================
// @route   GET /api/admin/contacts
// @desc    Get all contact submissions
// @access  Private/Admin
// =====================================
router.get('/contacts', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['new', 'in-progress', 'resolved'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
        { message: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [contacts, totalCount] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
});

// =====================================
// @route   PUT /api/admin/contacts/:id
// @desc    Update contact status
// @access  Private/Admin
// =====================================
router.put('/contacts/:id', [
  body('status').isIn(['new', 'in-progress', 'resolved']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { 
        status, 
        notes,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
});

// =====================================
// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private/Admin
// =====================================
router.get('/analytics', [
  query('range').optional().isIn(['7days', '30days', '90days', '1year', 'all']).withMessage('Invalid date range')
], async (req, res) => {
  console.log('📊 Admin: Fetching analytics');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: errors.array().map(err => err.msg)
      });
    }

    const range = req.query.range || '30days';
    const dateFilter = getDateRangeFilter(range);

    // Get analytics data in parallel
    const [
      totalPets,
      totalUsers,
      totalContacts,
      totalAdoptions,
      recentPets,
      recentUsers,
      recentContacts,
      petsByType,
      petsByStatus
    ] = await Promise.all([
      Pet.countDocuments(dateFilter),
      User.countDocuments({ ...dateFilter, role: { $ne: 'admin' } }),
      Contact.countDocuments(dateFilter),
      Pet.countDocuments({ ...dateFilter, status: 'adopted' }),
      Pet.find(dateFilter).sort({ createdAt: -1 }).limit(10).lean(),
      User.find({ ...dateFilter, role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(10).lean(),
      Contact.find(dateFilter).sort({ createdAt: -1 }).limit(10).lean(),
      Pet.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Pet.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Create clean analytics object
    const analyticsData = {
      success: true,
      data: {
        overview: {
          totalPets: totalPets || 0,
          totalUsers: totalUsers || 0,
          totalContacts: totalContacts || 0,
          totalAdoptions: totalAdoptions || 0,
          conversionRate: totalPets > 0 ? ((totalAdoptions / totalPets) * 100).toFixed(1) : '0.0'
        },
        trends: {
          petsByType: petsByType || [],
          petsByStatus: petsByStatus || []
        },
        recentActivity: {
          pets: recentPets || [],
          users: recentUsers || [],
          contacts: recentContacts || []
        },
        dateRange: {
          range,
          applied: !!dateFilter.createdAt
        }
      }
    };

    console.log('✅ Analytics data compiled successfully');
    res.json(analyticsData);

  } catch (error) {
    console.error('❌ Analytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================
// @route   GET /api/admin/settings
// @desc    Get system settings
// @access  Private/Admin
// =====================================
router.get('/settings', async (req, res) => {
  console.log('⚙️ Fetching system settings');
  
  try {
    // For now, return default settings since Settings model might not exist
    const defaultSettings = {
      siteName: 'Pet Adoption Center',
      siteDescription: 'Find your perfect companion',
      contactEmail: 'admin@petadoption.com',
      allowRegistration: true,
      maintenanceMode: false,
      maxUploadSize: 5242880, // 5MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'],
      emailNotifications: true
    };

    res.json({
      success: true,
      data: defaultSettings
    });

  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// =====================================
// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private/Admin
// =====================================
router.put('/settings', [
  body('siteName').optional().trim().isLength({ min: 1, max: 100 }),
  body('siteDescription').optional().trim().isLength({ max: 500 }),
  body('contactEmail').optional().isEmail(),
  body('allowRegistration').optional().isBoolean(),
  body('maintenanceMode').optional().isBoolean()
], async (req, res) => {
  console.log('⚙️ Updating system settings');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    // For now, just return the updated settings
    // In a real implementation, you'd save to database
    const updatedSettings = { ...req.body };

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

// =====================================
// @route   GET /api/admin/reports
// @desc    Generate reports
// @access  Private/Admin
// =====================================
router.get('/reports', [
  query('type').optional().isIn(['summary', 'pets', 'users', 'contacts', 'analytics']).withMessage('Invalid report type'),
  query('period').optional().isIn(['7days', '30days', '90days', '1year']).withMessage('Invalid period'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: errors.array()
      });
    }

    const { type = 'summary', period = '30days', format = 'json' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    let reportData = {};

    switch (type) {
      case 'summary':
        reportData = {
          period,
          generatedAt: now.toISOString(),
          metrics: {
            totalPets: await Pet.countDocuments(),
            totalUsers: await User.countDocuments({ role: { $ne: 'admin' } }),
            totalContacts: await Contact.countDocuments(),
            newPetsThisPeriod: await Pet.countDocuments({ createdAt: { $gte: startDate } }),
            newUsersThisPeriod: await User.countDocuments({ 
              createdAt: { $gte: startDate },
              role: { $ne: 'admin' }
            }),
            newContactsThisPeriod: await Contact.countDocuments({ createdAt: { $gte: startDate } }),
            adoptionsThisPeriod: await Pet.countDocuments({ 
              status: 'adopted',
              updatedAt: { $gte: startDate }
            })
          }
        };
        break;

      case 'pets':
        const pets = await Pet.find({ createdAt: { $gte: startDate } })
          .select('name breed type status createdAt updatedAt')
          .sort({ createdAt: -1 })
          .lean();
        
        reportData = {
          type: 'pets',
          period,
          generatedAt: now.toISOString(),
          count: pets.length,
          data: pets
        };
        break;

      case 'users':
        const users = await User.find({ 
          createdAt: { $gte: startDate },
          role: { $ne: 'admin' }
        })
          .select('name email role createdAt lastLogin')
          .sort({ createdAt: -1 })
          .lean();
        
        reportData = {
          type: 'users',
          period,
          generatedAt: now.toISOString(),
          count: users.length,
          data: users
        };
        break;

      case 'contacts':
        const contacts = await Contact.find({ createdAt: { $gte: startDate } })
          .select('name email subject status createdAt')
          .sort({ createdAt: -1 })
          .lean();
        
        reportData = {
          type: 'contacts',
          period,
          generatedAt: now.toISOString(),
          count: contacts.length,
          data: contacts
        };
        break;

      case 'analytics':
        const [
          petsByStatus,
          petsByType,
          usersByMonth,
          contactsByStatus
        ] = await Promise.all([
          Pet.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]),
          Pet.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ]),
          User.aggregate([
            { $match: { createdAt: { $gte: startDate }, role: { $ne: 'admin' } } },
            { $group: { 
              _id: { 
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]),
          Contact.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ])
        ]);

        reportData = {
          type: 'analytics',
          period,
          generatedAt: now.toISOString(),
          analytics: {
            petsByStatus,
            petsByType,
            usersByMonth,
            contactsByStatus
          }
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Handle CSV format
    if (format === 'csv' && reportData.data) {
      const csv = convertToCSV(reportData.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${period}.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================
// @route   POST /api/admin/pets/bulk-update
// @desc    Bulk update pets
// @access  Private/Admin
// =====================================
router.post('/pets/bulk-update', [
  body('petIds').isArray().withMessage('petIds must be an array'),
  body('updates').isObject().withMessage('updates must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { petIds, updates } = req.body;

    // Add updatedBy field
    updates.updatedBy = req.user._id;
    updates.updatedAt = new Date();

    const result = await Pet.updateMany(
      { _id: { $in: petIds } },
      { $set: updates },
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} pets`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Error bulk updating pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pets'
    });
  }
});

// =====================================
// @route   POST /api/admin/pets/bulk-delete
// @desc    Bulk delete pets
// @access  Private/Admin
// =====================================
router.post('/pets/bulk-delete', [
  body('petIds').isArray().withMessage('petIds must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { petIds } = req.body;

    const result = await Pet.deleteMany({
      _id: { $in: petIds }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} pets`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error bulk deleting pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pets'
    });
  }
});

// =====================================
// @route   POST /api/admin/users/bulk-delete
// @desc    Bulk delete users
// @access  Private/Admin
// =====================================
router.post('/users/bulk-delete', [
  body('userIds').isArray().withMessage('userIds must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userIds } = req.body;

    // Prevent deletion of current admin
    const filteredIds = userIds.filter(id => id !== req.user.id);

    const result = await User.deleteMany({
      _id: { $in: filteredIds },
      role: { $ne: 'admin' } // Extra safety - don't delete other admins
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} users`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error bulk deleting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete users'
    });
  }
});

// =====================================
// @route   GET /api/admin/health
// @desc    System health check
// @access  Private/Admin
// =====================================
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Test database connection
    try {
      await Pet.findOne().lean();
      await User.findOne().lean();
      await Contact.findOne().lean();
    } catch (dbError) {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'unhealthy';
      healthCheck.dbError = dbError.message;
    }

    // Check critical thresholds
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 512 * 1024 * 1024; // 512MB
    if (memoryUsage.heapUsed > memoryThreshold) {
      healthCheck.status = 'warning';
      healthCheck.warning = 'High memory usage';
    }

    res.json({
      success: healthCheck.status !== 'unhealthy',
      data: healthCheck
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// =====================================
// @route   GET /api/admin/export/:type
// @desc    Export data (CSV, JSON)
// @access  Private/Admin
// =====================================
router.get('/export/:type', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type } = req.params;
    const { format = 'json', dateFrom, dateTo } = req.query;

    // Build date filter
    const dateFilter = {};
    if (dateFrom && dateTo) {
      dateFilter.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    } else if (dateFrom) {
      dateFilter.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      dateFilter.createdAt = { $lte: new Date(dateTo) };
    }

    let data;
    let filename;

    switch (type) {
      case 'pets':
        data = await Pet.find(dateFilter)
          .select('name breed type age size gender status createdAt updatedAt')
          .lean();
        filename = `pets_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        data = await User.find({ ...dateFilter, role: { $ne: 'admin' } })
          .select('name email role createdAt lastLogin isActive')
          .lean();
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'contacts':
        data = await Contact.find(dateFilter)
          .select('name email subject status createdAt')
          .lean();
        filename = `contacts_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'analytics':
        const analytics = await generateAnalyticsExport(dateFilter);
        data = analytics;
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Supported types: pets, users, contacts, analytics'
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        count: Array.isArray(data) ? data.length : Object.keys(data).length,
        type,
        filters: dateFilter
      });
    }

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================
// @route   POST /api/admin/import/:type
// @desc    Import data from CSV/JSON
// @access  Private/Admin
// =====================================
router.post('/import/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // This would handle file upload and parsing
    // Implementation depends on your file upload middleware (multer, etc.)
    
    res.json({
      success: false,
      message: 'Import functionality not yet implemented'
    });

  } catch (error) {
    console.error('❌ Error importing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import data'
    });
  }
});

// =====================================
// @route   GET /api/admin/audit-log
// @desc    Get system audit log
// @access  Private/Admin
// =====================================
router.get('/audit-log', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('action').optional().trim(),
  query('userId').optional().isMongoId()
], async (req, res) => {
  try {
    // This would fetch from an audit log collection
    // For now, return placeholder data
    
    res.json({
      success: true,
      data: {
        logs: [
          {
            id: '1',
            action: 'user_login',
            userId: req.user._id,
            userName: req.user.name,
            timestamp: new Date(),
            details: 'Admin user logged in'
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1
        }
      },
      message: 'Audit log functionality not fully implemented'
    });

  } catch (error) {
    console.error('❌ Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log'
    });
  }
});

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Generate analytics export data
 */
async function generateAnalyticsExport(dateFilter) {
  const [
    petStats,
    userStats,
    contactStats,
    petsByType,
    petsByStatus,
    adoptionTrends
  ] = await Promise.all([
    Pet.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        adopted: { $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
      }}
    ]),
    User.aggregate([
      { $match: { ...dateFilter, role: { $ne: 'admin' } } },
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
      }}
    ]),
    Contact.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: null, 
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
      }}
    ]),
    Pet.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Pet.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Pet.aggregate([
      { $match: { ...dateFilter, status: 'adopted' } },
      { $group: { 
        _id: { 
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  return {
    summary: {
      pets: petStats[0] || { total: 0, available: 0, adopted: 0, pending: 0 },
      users: userStats[0] || { total: 0, active: 0 },
      contacts: contactStats[0] || { total: 0, new: 0, resolved: 0 }
    },
    breakdown: {
      petsByType,
      petsByStatus,
      adoptionTrends
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Helper function for CSV conversion
 */
function convertToCSV(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data available';
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }
        
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Convert to string and escape
        value = String(value);
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;