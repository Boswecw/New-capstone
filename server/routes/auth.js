// server/routes/auth.js - Complete Fixed Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Helper function to generate username from email
const generateUsernameFromEmail = (email) => {
  const baseUsername = email.split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .substring(0, 20); // Limit length
    
  return baseUsername.length >= 3 ? baseUsername : `user_${baseUsername}`;
};

// Helper function to ensure unique username
const ensureUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 1000) {
      username = `${baseUsername}_${Date.now()}`;
      break;
    }
  }
  
  return username;
};

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// =====================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// =====================================
router.post('/register', validateRegistration, async (req, res) => {
  console.log('🔍 Registration attempt for:', req.body.email);

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Registration validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Registration failed - email already exists:', email);
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists' 
      });
    }

    // Generate unique username from email
    const baseUsername = generateUsernameFromEmail(email);
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    console.log('📝 Generated username:', uniqueUsername);

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      name: name.trim(),
      username: uniqueUsername,
      email: email.toLowerCase().trim(),
      password,
      role: 'user',
      isActive: true,
      emailVerified: false
    });

    const savedUser = await user.save();
    console.log('✅ User created successfully:', savedUser.email);

    // Generate JWT token
    const token = generateToken(savedUser._id);

    // Prepare response (excluding sensitive data)
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      isActive: savedUser.isActive,
      emailVerified: savedUser.emailVerified,
      createdAt: savedUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to FurBabies.',
      token,
      user: userResponse
    });

    console.log('✅ Registration response sent successfully');

  } catch (error) {
    console.error('❌ Registration error occurred:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message = field === 'email' 
        ? 'An account with this email already exists' 
        : 'This username is already taken';
        
      return res.status(409).json({ 
        success: false, 
        message 
      });
    }

    if (error.name === 'ValidationError') {
      console.error('❌ Mongoose validation error:', error.errors);
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Please check your input and try again',
        errors: validationErrors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again later.' 
    });
  }
});

// =====================================
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// =====================================
router.post('/login', validateLogin, async (req, res) => {
  console.log('🔍 Login attempt for email:', req.body.email);
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide valid email and password',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        success: false, 
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare response (excluding sensitive data)
    const userResponse = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

    console.log('✅ Login successful for:', user.email);

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again later.' 
    });
  }
});

// =====================================
// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
// =====================================
router.get('/me', protect, async (req, res) => {
  console.log('👤 GET /api/auth/me - Fetching current user profile');
  
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('favorites', 'name images type breed')
      .populate('adoptedPets.pet', 'name images type breed');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// =====================================
// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
// =====================================
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
    
  body('profile.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
  console.log('👤 PUT /api/auth/profile - Updating user profile');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'profile'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'profile') {
          updates.profile = { ...user.profile, ...req.body.profile };
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// =====================================
// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
// =====================================
router.post('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], async (req, res) => {
  console.log('🔐 POST /api/auth/change-password');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// =====================================
// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
// =====================================
router.post('/logout', protect, (req, res) => {
  console.log('🚪 POST /api/auth/logout');
  
  // Since we're using JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future token blacklisting
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// =====================================
// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
// =====================================
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  console.log('📧 POST /api/auth/forgot-password');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const { email } = req.body;
    const user = await User.findByEmail(email);

    // Don't reveal whether user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHashed;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // TODO: Send email with reset link
    // For now, just log the token (remove in production)
    console.log('🔑 Reset token for', email, ':', resetToken);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('❌ Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// =====================================
// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
// =====================================
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], async (req, res) => {
  console.log('🔄 POST /api/auth/reset-password');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { token, password } = req.body;
    
    // Hash the token to compare with stored version
    const resetTokenHashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetTokenHashed,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

module.exports = router;