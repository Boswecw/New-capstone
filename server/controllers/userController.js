// server/controllers/userController.js
import User from '../models/User.js';
import Pet from '../models/Pet.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, firstName, lastName } = req.body;

    const fullName = (name || `${firstName || ''} ${lastName || ''}`.trim()).trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: fullName,
      email,
      password
    });
    
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
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
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
          profile: user.profile
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('favorites');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.email;
    delete updates.role;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get user favorites
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites')
      .select('favorites');

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// Add pet to favorites
export const addToFavorites = async (req, res) => {
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
    
    // Add to favorites if not already there
    const user = await User.findById(userId);
    if (!user.favorites.includes(petId)) {
      user.favorites.push(petId);
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Pet added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
};

// Remove pet from favorites
export const removeFromFavorites = async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    user.favorites = user.favorites.filter(
      id => id.toString() !== petId
    );
    await user.save();
    
    res.json({
      success: true,
      message: 'Pet removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
};

// Default export
const userController = {
  register,
  login,
  getProfile,
  updateProfile,
  getFavorites,
  addToFavorites,
  removeFromFavorites
};

export default userController;