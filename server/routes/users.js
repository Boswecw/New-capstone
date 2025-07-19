// server/routes/users.js - UPDATED: Authentication removed, focus on user management
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const { 
  validateUserProfile, 
  validateObjectId,
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// ========================================
// USER PROFILE MANAGEMENT ROUTES
// ========================================

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('👤 GET /api/users/profile - User ID:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('-password -loginAttempts -lockUntil')
      .populate('favorites', 'name type breed image status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validateUserProfile, async (req, res) => {
  try {
    console.log('👤 PUT /api/users/profile - Updating user:', req.user._id);
    
    const allowedUpdates = ['name', 'email', 'profile'];
    const updates = {};
    
    // Only allow specific fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// ========================================
// USER FAVORITES MANAGEMENT
// ========================================

// @route   GET /api/users/favorites
// @desc    Get user's favorite pets
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    console.log('❤️ GET /api/users/favorites - User ID:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        select: 'name type breed age image status location price description',
        match: { status: { $ne: 'deleted' } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.favorites || [],
      count: user.favorites?.length || 0,
      message: 'Favorites retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites'
    });
  }
});

// @route   POST /api/users/favorites/:petId
// @desc    Add pet to favorites
// @access  Private
router.post('/favorites/:petId', protect, validateObjectId, async (req, res) => {
  try {
    const { petId } = req.params;
    console.log('❤️ POST /api/users/favorites - Adding pet:', petId);

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in favorites
    if (user.favorites.includes(petId)) {
      return res.status(400).json({
        success: false,
        message: 'Pet already in favorites'
      });
    }

    await user.addToFavorites(petId);

    res.json({
      success: true,
      message: 'Pet added to favorites',
      data: { petId, petName: pet.name }
    });

  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites'
    });
  }
});

// @route   DELETE /api/users/favorites/:petId
// @desc    Remove pet from favorites
// @access  Private
router.delete('/favorites/:petId', protect, validateObjectId, async (req, res) => {
  try {
    const { petId } = req.params;
    console.log('💔 DELETE /api/users/favorites - Removing pet:', petId);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if pet is in favorites
    if (!user.favorites.includes(petId)) {
      return res.status(400).json({
        success: false,
        message: 'Pet not in favorites'
      });
    }

    await user.removeFromFavorites(petId);

    res.json({
      success: true,
      message: 'Pet removed from favorites',
      data: { petId }
    });

  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites'
    });
  }
});

// ========================================
// ADMIN USER MANAGEMENT ROUTES
// ========================================

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('👥 GET /api/users - Admin fetching users');

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -loginAttempts -lockUntil')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('favorites', 'name type breed');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      message: 'Users retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log('👤 GET /api/users/:id - Admin fetching user:', req.params.id);

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('favorites', 'name type breed image status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log('👤 PUT /api/users/:id - Admin updating user:', req.params.id);

    const allowedUpdates = ['name', 'email', 'role', 'isActive', 'profile'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
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
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/users/:id - Admin deleting user:', req.params.id);

    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { deletedUserId: req.params.id }
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// ========================================
// USER STATISTICS (Admin)
// ========================================

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    console.log('📊 GET /api/users/stats/overview - Admin fetching stats');

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        recentUsers,
        usersByRole
      },
      message: 'User statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================
router.use((err, req, res, next) => {
  console.error('❌ Users route error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = router;