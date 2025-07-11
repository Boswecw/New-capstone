// routes/users.js - COMPLETE UPDATED VERSION
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pet = require('../models/Pet');
const { protect, generateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  validateObjectId
} = require('../middleware/validation');

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
  } = user.toObject();
  return sanitizedUser;
};

// ===== TEST & DEBUG ROUTES =====
router.get('/test', (req, res) => {
  console.log('🧪 User routes test endpoint hit');
  res.json({
    success: true,
    message: 'User routes are working perfectly!',
    timestamp: new Date().toISOString(),
    route: '/api/users/test',
    server: 'Render deployment'
  });
});

router.get('/debug', (req, res) => {
  console.log('🐛 User debug endpoint hit');
  res.json({
    success: true,
    message: 'User routes debug information',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
    },
    request: {
      method: req.method,
      path: req.path,
      origin: req.get('Origin'),
      userAgent: req.get('User-Agent') ? req.get('User-Agent').substring(0, 50) + '...' : 'None',
      contentType: req.get('Content-Type'),
    },
    availableRoutes: [
      'GET /api/users/test',
      'GET /api/users/debug',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/profile',
      'PUT /api/users/profile',
      'GET /api/users/favorites',
      'POST /api/users/favorites/:petId',
      'DELETE /api/users/favorites/:petId'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===== AUTHENTICATION ROUTES =====

// POST /api/users/register - User registration
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { 
      email: req.body.email, 
      name: req.body.name,
      hasPassword: !!req.body.password 
    });

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Registration failed - user exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    };

    // Add optional fields if provided
    if (phone) userData.profile = { ...userData.profile, phone };
    if (address) userData.profile = { ...userData.profile, address };

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle validation errors
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
      message: 'Error registering user',
      error: error.message
    });
  }
});

// POST /api/users/login - User login
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    console.log('Request headers:', {
      origin: req.get('Origin'),
      contentType: req.get('Content-Type'),
      userAgent: req.get('User-Agent') ? req.get('User-Agent').substring(0, 50) + '...' : 'None'
    });

    const { email, password } = req.body;

    // Find user and include password for verification
    const user = await User.findByEmail(email).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email, 'Active:', user.isActive);

    // Check if account is locked
    if (user.isLocked) {
      console.log('❌ Account locked:', email);
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    console.log('🔒 Verifying password for:', email);
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log('❌ Password verification failed for:', email);
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified for:', email);

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('🎉 Login successful for:', user.email, 'Role:', user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          profile: user.profile
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in user',
      error: error.message
    });
  }
});

// ===== PROFILE ROUTES =====

// GET /api/users/profile - Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('👤 Profile request for user:', req.user._id);

    const user = await User.findById(req.user._id)
      .populate('favorites', 'name type breed age imageUrl status')
      .populate('adoptedPets.pet', 'name type breed imageUrl');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile,
        favorites: user.favorites,
        adoptedPets: user.adoptedPets,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', protect, validateUserProfile, async (req, res) => {
  try {
    console.log('📝 Profile update for user:', req.user._id);

    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated here
    const forbiddenFields = ['password', 'email', 'role', '_id', 'id', 'createdAt', 'updatedAt'];
    forbiddenFields.forEach(field => delete updates[field]);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      data: sanitizeUser(user),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    
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

    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// ===== FAVORITES ROUTES =====

// GET /api/users/favorites - Get user favorites
router.get('/favorites', protect, async (req, res) => {
  try {
    console.log('❤️ Favorites request for user:', req.user._id);

    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        select: 'name type breed age imageUrl status location description',
        match: { status: { $ne: 'deleted' } }
      })
      .select('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.favorites,
      count: user.favorites.length,
      message: 'Favorites retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
});

// POST /api/users/favorites/:petId - Add pet to favorites
router.post('/favorites/:petId', protect, validateObjectId, async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user._id;

    console.log('❤️ Adding pet to favorites:', { userId, petId });

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Add to favorites using the User model method
    const user = await User.findById(userId);
    await user.addToFavorites(petId);

    console.log('✅ Pet added to favorites:', pet.name);

    res.json({
      success: true,
      message: `${pet.name} added to favorites`,
      data: {
        petId: pet._id,
        petName: pet.name
      }
    });
  } catch (error) {
    console.error('❌ Add favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
});

// DELETE /api/users/favorites/:petId - Remove pet from favorites
router.delete('/favorites/:petId', protect, validateObjectId, async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user._id;

    console.log('💔 Removing pet from favorites:', { userId, petId });

    // Get pet info for response
    const pet = await Pet.findById(petId);
    
    // Remove from favorites using the User model method
    const user = await User.findById(userId);
    await user.removeFromFavorites(petId);

    console.log('✅ Pet removed from favorites:', pet?.name || petId);

    res.json({
      success: true,
      message: `${pet?.name || 'Pet'} removed from favorites`,
      data: {
        petId: petId,
        petName: pet?.name
      }
    });
  } catch (error) {
    console.error('❌ Remove favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
});

// GET /api/users/favorites/check/:petId - Check if pet is in favorites
router.get('/favorites/check/:petId', protect, validateObjectId, async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user._id;

    const user = await User.findById(userId).select('favorites');
    const isFavorite = user.isFavorite(petId);

    res.json({
      success: true,
      data: {
        isFavorite,
        petId
      },
      message: 'Favorite status retrieved'
    });
  } catch (error) {
    console.error('❌ Check favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking favorite status',
      error: error.message
    });
  }
});

// ===== USER MANAGEMENT ROUTES =====

// GET /api/users/adopted-pets - Get user's adopted pets
router.get('/adopted-pets', protect, async (req, res) => {
  try {
    console.log('🐕 Adopted pets request for user:', req.user._id);

    const user = await User.findById(req.user._id)
      .populate({
        path: 'adoptedPets.pet',
        select: 'name type breed age imageUrl description'
      })
      .select('adoptedPets');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.adoptedPets,
      count: user.adoptedPets.length,
      message: 'Adopted pets retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Adopted pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adopted pets',
      error: error.message
    });
  }
});

// GET /api/users/applications - Get user's adoption applications
router.get('/applications', protect, async (req, res) => {
  try {
    console.log('📋 Applications request for user:', req.user._id);

    const user = await User.findById(req.user._id)
      .populate({
        path: 'applications.pet',
        select: 'name type breed age imageUrl status'
      })
      .select('applications');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Sort applications by most recent first
    user.applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      success: true,
      data: user.applications,
      count: user.applications.length,
      message: 'Applications retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// ===== PASSWORD MANAGEMENT =====

// POST /api/users/change-password - Change password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed for user:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

module.exports = router;