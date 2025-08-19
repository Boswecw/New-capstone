// server/routes/auth.js - Complete Authentication Routes (FIXED)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth'); // Import protect middleware

// Generate JWT Token - FIXED: use 'id' instead of 'userId'
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to generate username from email
const generateUsernameFromEmail = (email) => {
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  return baseUsername.length >= 3 ? baseUsername : `user_${baseUsername}`;
};

// Helper function to ensure unique username
const ensureUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username })) {
    username = `${baseUsername}_${counter}`;
    counter++;
  }
  
  return username;
};

// =====================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// =====================================
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  console.log('🔍 Registration attempt for:', req.body.email);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Registration validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Registration failed - email already exists:', email);
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Generate unique username from email
    const baseUsername = generateUsernameFromEmail(email);
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    console.log('📝 Generated username:', uniqueUsername);

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      name,
      username: uniqueUsername, // FIXED: Add required username field
      email,
      password, // Let the model handle hashing
      role: 'user',
      isActive: true
    });

    const savedUser = await user.save();
    console.log('✅ User created successfully:', savedUser.email);

    // Generate JWT token
    const token = generateToken(savedUser._id);
    
    if (!token) {
      console.error('❌ Failed to generate JWT token');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate authentication token' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role
      }
    });

    console.log('✅ Registration response sent successfully');

  } catch (error) {
    console.error('❌ Registration error occurred:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error - email or username already exists');
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        success: false, 
        message: `${field === 'email' ? 'Email' : 'Username'} already registered` 
      });
    }

    if (error.name === 'ValidationError') {
      console.error('❌ Mongoose validation error:', error.errors);
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// =====================================
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// =====================================
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('🔍 Login attempt for email:', req.body.email);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Login validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password field - FIXED: Also check for locked accounts
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // FIXED: Check if account is locked
    if (user.isLocked) {
      console.log('🔒 Account is locked:', email);
      return res.status(423).json({ 
        success: false, 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      
      // FIXED: Increment login attempts on failed password
      await user.incLoginAttempts();
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    if (!user.isActive) {
      console.log('❌ Account deactivated for:', email);
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // FIXED: Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // FIXED: Update last login timestamp
    await user.updateLastLogin();

    const token = generateToken(user._id);
    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// =====================================
// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
// =====================================
router.get('/me', protect, async (req, res) => {
  try {
    console.log('👤 GET /api/auth/me - Fetching current user profile');
    
    // req.user is set by the protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found in request'
      });
    }

    // Return user data (password already excluded by protect middleware)
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile,
        createdAt: req.user.createdAt,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
});

// =====================================
// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public
// =====================================
router.post('/logout', (req, res) => {
  console.log('🚪 Logout request received');
  
  // Since we're using JWT tokens, logout is handled client-side
  // This endpoint exists for consistency but doesn't need to do much
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// =====================================
// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
// =====================================
router.post('/refresh', protect, async (req, res) => {
  try {
    console.log('🔄 Token refresh request for user:', req.user.email);
    
    // Generate new token
    const newToken = generateToken(req.user._id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
});

// =====================================
// DEVELOPMENT ONLY - DEBUG ROUTES
// =====================================
if (process.env.NODE_ENV === 'development') {
  
  // Create admin user for testing
  router.post('/create-admin', async (req, res) => {
    try {
      const { email = 'admin@test.com', password = 'admin123', name = 'Admin User' } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Admin user already exists',
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role
          }
        });
      }

      // Generate unique username
      const baseUsername = generateUsernameFromEmail(email);
      const uniqueUsername = await ensureUniqueUsername(baseUsername);

      // Create admin user
      const adminUser = new User({
        name,
        username: uniqueUsername,
        email,
        password, // Will be hashed by pre-save middleware
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created:', email);

      res.json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: adminUser._id,
          name: adminUser.name,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role
        }
      });

    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating admin user',
        error: error.message
      });
    }
  });

  // List all users for debugging
  router.get('/debug-users', async (req, res) => {
    try {
      const users = await User.find({}).select('name username email role createdAt isActive lastLogin');
      console.log('📊 Total users in database:', users.length);

      res.json({
        success: true,
        count: users.length,
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }))
      });

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  });

  // Debug login with detailed information
  router.post('/debug-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔍 Debug login attempt:', {
        email,
        passwordProvided: !!password,
        passwordLength: password?.length
      });

      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        console.log('❌ User not found:', email);
        return res.json({
          success: false,
          userFound: false,
          message: 'User not found'
        });
      }

      console.log('👤 User found:', {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        isActive: user.isActive,
        isLocked: user.isLocked,
        loginAttempts: user.loginAttempts
      });

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      console.log('🔐 Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        return res.json({
          success: false,
          userFound: true,
          passwordMatch: false,
          message: 'Invalid password'
        });
      }

      if (!user.isActive) {
        return res.json({
          success: false,
          userFound: true,
          passwordMatch: true,
          accountActive: false,
          message: 'User account is deactivated'
        });
      }

      if (user.isLocked) {
        return res.json({
          success: false,
          userFound: true,
          passwordMatch: true,
          accountActive: true,
          accountLocked: true,
          message: 'Account is temporarily locked'
        });
      }

      // Generate token for successful debug login
      const token = generateToken(user._id);
      console.log('✅ Debug login successful, token generated');

      res.json({
        success: true,
        userFound: true,
        passwordMatch: true,
        accountActive: true,
        accountLocked: false,
        message: 'Debug login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('❌ Debug login error:', error);
      res.status(500).json({
        success: false,
        message: 'Debug login error',
        error: error.message
      });
    }
  });

  // Test token generation
  router.get('/test-token', (req, res) => {
    try {
      const testUserId = '507f1f77bcf86cd799439011'; // Sample ObjectId
      const token = generateToken(testUserId);
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      res.json({
        success: true,
        message: 'Token generation test successful',
        token: token.substring(0, 20) + '...',
        decoded: decoded,
        jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Token generation test failed',
        error: error.message,
        jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
      });
    }
  });

  // FIXED: Clean up expired locked accounts
  router.post('/cleanup-locks', async (req, res) => {
    try {
      const result = await User.updateMany(
        { 
          lockUntil: { $lte: new Date() }
        },
        { 
          $unset: { lockUntil: 1, loginAttempts: 1 }
        }
      );

      res.json({
        success: true,
        message: 'Account locks cleaned up',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cleaning up locks',
        error: error.message
      });
    }
  });
}

module.exports = router;