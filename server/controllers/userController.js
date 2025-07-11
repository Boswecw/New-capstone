// server/controllers/userController.js - FIXED for CommonJS
const User = require('../models/User');
const Pet = require('../models/Pet');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, name } = req.body;
    
    // ✅ FIXED: Handle both name formats
    const userName = name || (firstName && lastName ? `${firstName} ${lastName}` : username);
    
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, ...(username ? [{ username }] : [])]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const userData = {
      name: userName,
      email,
      password,
    };
    
    // Add username if provided
    if (username) {
      userData.username = username;
    }
    
    // Add profile data if provided
    if (firstName || lastName) {
      userData.profile = {
        ...userData.profile,
        firstName,
        lastName
      };
    }
    
    const user = new User(userData);
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // ✅ FIXED: Support both email and username login
    const loginField = email || username;
    
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: loginField.toLowerCase() },
        ...(username ? [{ username: loginField }] : [])
      ]
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
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
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
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
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates._id;
    delete updates.id;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
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
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get user favorites
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites', 'name type breed age imageUrl status location')
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
      message: 'Favorites retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// Add pet to favorites
const addToFavorites = async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user.id;
    
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
    
    res.json({
      success: true,
      message: 'Pet added to favorites'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
};

// Remove pet from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user.id;
    
    // Remove from favorites using the User model method
    const user = await User.findById(userId);
    await user.removeFromFavorites(petId);
    
    res.json({
      success: true,
      message: 'Pet removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getFavorites,
  addToFavorites,
  removeFromFavorites
};