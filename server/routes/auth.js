// server/routes/auth.js - ENHANCED WITH DEBUG LOGGING
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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
  console.log('🔍 Registration attempt started');
  console.log('📝 Request body:', { 
    name: req.body.name, 
    email: req.body.email, 
    passwordLength: req.body.password?.length 
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    console.log('🔍 Checking if user exists with email:', email);
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    console.log('✅ Email is available, creating new user...');
    
    // ✅ ENHANCED: More detailed user creation with explicit error handling
    const userData = { name, email, password };
    console.log('📦 User data to create:', { 
      name: userData.name, 
      email: userData.email, 
      passwordProvided: !!userData.password 
    });

    const user = new User(userData);
    console.log('🔧 User instance created, saving to database...');
    
    const savedUser = await user.save();
    console.log('✅ User saved successfully!');
    console.log('📊 Saved user details:', {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt
    });

    // Generate token
    const token = generateToken(savedUser._id);
    console.log('🔑 JWT token generated');

    // ✅ VERIFY: Double-check user was actually saved
    const verifyUser = await User.findById(savedUser._id);
    if (verifyUser) {
      console.log('✅ VERIFICATION: User found in database after save');
    } else {
      console.error('❌ VERIFICATION FAILED: User not found in database after save!');
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
        passwordLength: user.password?.length,
        passwordStartsWith: user.password?.substring(0, 10) + '...',
        isActive: user.isActive
      });
      
      // Test password comparison manually
      if (user.password && password) {
        console.log('🔍 Testing password comparison...');
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔍 Manual bcrypt compare result:', isMatch);
        
        // Test using model method
        if (user.comparePassword) {
          const modelMatch = await user.comparePassword(password);
          console.log('🔍 Model method compare result:', modelMatch);
        }
      }
    }
    
    res.json({ 
      success: true, 
      userFound: !!user,
      hasPassword: user ? !!user.password : false
    });
  } catch (error) {
    console.error('❌ Debug login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;