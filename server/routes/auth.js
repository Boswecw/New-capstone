// server/routes/auth.js - Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
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
        email: savedUser.email,
        role: savedUser.role
      }
    });

    console.log('✅ Registration response sent successfully');

  } catch (error) {
    console.error('❌ Registration error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error - email already exists');
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
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
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

    if (!user || !(await user.comparePassword(password))) {
      console.log('❌ Invalid credentials for:', email);
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

    const token = generateToken(user._id);
    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Add these at the end of your auth.js file, before module.exports

if (process.env.NODE_ENV === 'development') {
  // DEBUG ROUTE 1: See all users
  router.get('/debug-users', async (req, res) => {
    try {
      const users = await User.find({}).select('name email createdAt');
      console.log('📊 Total users in database:', users.length);

      res.json({
        success: true,
        count: users.length,
        users: users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DEBUG ROUTE 2: Test specific login
  router.post('/debug-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('🔍 Debug login for:', email);
      console.log('📝 Password provided:', !!password, 'Length:', password?.length);

      // Find user WITH password field (important!)
      const user = await User.findOne({ email }).select('+password');
      console.log('👤 User found:', !!user);

      if (user) {
        console.log('📊 User data:', {
          id: user._id,
          name: user.name,
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password?.length
        });

        // Test password comparison
        const isMatch = await user.comparePassword(password);
        console.log('🔐 Password match:', isMatch);

        res.json({
          success: true,
          userFound: true,
          passwordMatch: isMatch,
          userDetails: {
            id: user._id,
            name: user.name,
            email: user.email,
            isActive: user.isActive
          }
        });
      } else {
        res.json({
          success: false,
          userFound: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('❌ Debug login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = router;