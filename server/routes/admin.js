// server/routes/admin.js - Complete Fixed Admin Routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const { protect, admin } = require('../middleware/auth');

// Import models
const User = require('../models/User');
const Pet = require('../models/Pet');
const Product = require('../models/Product');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');

// Apply authentication middleware to all admin routes
router.use(protect);
router.use(admin);

// Helper function to safely serialize data (prevent circular JSON)
const safeSerialize = (obj) => {
  const cache = new Set();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  }));
};

// Helper function to create date range filter
const getDateRangeFilter = (range) => {
  const now = new Date();
  const filters = {};
  
  switch (range) {
    case '7days':
      filters.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      break;
    case '30days':
      filters.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      break;
    case '90days':
      filters.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
      break;
    case '1year':
      filters.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
      break;
    default:
      // No filter for 'all'
      break;
  }
  
  return filters;
};

// =====================================
// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private/Admin
// =====================================
router.get('/dashboard', async (req, res) => {
  console.log('📊 Admin: Fetching dashboard data');
  
  try {
    // Run all queries in parallel for better performance
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
      Pet.countDocuments({ status: 'available' }),
      Pet.countDocuments({ status: 'adopted' }),
      Pet.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments(),
      Contact.countDocuments(),
      Pet.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name type breed images status createdAt')
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
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters')
], async (req, res) => {
  console.log('👤 Admin: Updating user', req.params.id);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['role', 'isActive', 'name'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// =====================================
// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private/Admin
// =====================================
router.delete('/users/:id', async (req, res) => {
  console.log('🗑️ Admin: Deleting user', req.params.id);
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
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
// @route   GET /api/admin/pets
// @desc    Get all pets for admin management
// @access  Private/Admin
// =====================================
router.get('/pets', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['available', 'adopted', 'pending'])
], async (req, res) => {
  console.log('🐕 Admin: Fetching pets list');
  
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { breed: { $regex: req.query.search, $options: 'i' } },
        { type: { $regex: req.query.search, $options: 'i' } }
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

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        pets,
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
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets'
    });
  }
});

// =====================================
// @route   GET /api/admin/contacts
// @desc    Get contact messages
// @access  Private/Admin
// =====================================
router.get('/contacts', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['new', 'read', 'replied', 'resolved'])
], async (req, res) => {
  console.log('📧 Admin: Fetching contacts');
  
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

    const filter = {};
    if (req.query.status && req.query.status !== '') {
      filter.status = req.query.status;
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
  body('status').isIn(['new', 'read', 'replied', 'resolved']).withMessage('Invalid status')
], async (req, res) => {
  console.log('📧 Admin: Updating contact', req.params.id);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errors: errors.array().map(err => err.msg)
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status: req.body.status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
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
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new Settings({});
      await settings.save();
      console.log('✅ Created default settings');
    }

    res.json({
      success: true,
      data: settings
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

    const settings = await Settings.updateSettings(req.body);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// =====================================
// @route   GET /api/admin/reports
// @desc    Generate various reports
// @access  Private/Admin
// =====================================
router.get('/reports', [
  query('type').isIn(['users', 'pets', 'contacts', 'adoptions']).withMessage('Invalid report type'),
  query('range').optional().isIn(['7days', '30days', '90days', '1year', 'all'])
], async (req, res) => {
  console.log('📊 Admin: Generating report');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { type, range = '30days' } = req.query;
    const dateFilter = getDateRangeFilter(range);

    let reportData;

    switch (type) {
      case 'users':
        reportData = await User.aggregate([
          { $match: { ...dateFilter, role: { $ne: 'admin' } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      case 'pets':
        reportData = await Pet.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
              adopted: { $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] } },
              pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      case 'contacts':
        reportData = await Contact.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      case 'adoptions':
        reportData = await Pet.aggregate([
          { $match: { ...dateFilter, status: 'adopted' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: {
        type,
        range,
        reportData: reportData || [],
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

// =====================================
// @route   GET /api/admin/logs
// @desc    Get system logs (placeholder)
// @access  Private/Admin
// =====================================
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    message: 'Logs endpoint - to be implemented',
    data: []
  });
});

// =====================================
// @route   GET /api/admin/config
// @desc    Get system configuration
// @access  Private/Admin
// =====================================
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      nodeEnv: process.env.NODE_ENV,
      version: '1.0.0',
      features: {
        emailEnabled: !!process.env.SMTP_HOST,
        cloudStorageEnabled: !!process.env.CLOUD_STORAGE_BUCKET,
        analyticsEnabled: true
      }
    }
  });
});

// =====================================
// @route   GET /api/admin/backups
// @desc    Get backup information
// @access  Private/Admin
// =====================================
router.get('/backups', (req, res) => {
  res.json({
    success: true,
    message: 'Backup endpoint - to be implemented',
    data: {
      lastBackup: null,
      nextScheduled: null,
      status: 'Not configured'
    }
  });
});

module.exports = router;