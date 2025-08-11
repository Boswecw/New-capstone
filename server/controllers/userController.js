// server/controllers/userController.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pet = require('../models/Pet');

// ===== Helpers =====
const requireEnv = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const sendError = (res, status, message, error) =>
  res.status(status).json({ success: false, message, error: error ? String(error) : undefined });

const generateToken = (userId) => {
  const secret = requireEnv('JWT_SECRET');
  return jwt.sign({ id: userId }, secret, { expiresIn: '30d' });
};

// ===== Auth =====
const register = async (req, res) => {
  try {
    let { name, email, password, firstName, lastName } = req.body;
    email = normalizeEmail(email);

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }
    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return sendError(res, 400, 'User with this email already exists');
    }

    const fullName = (name || `${firstName || ''} ${lastName || ''}`.trim()).trim();

    const user = new User({
      name: fullName || undefined,
      email,
      password, // assume model hashes in pre('save')
    });
    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Error registering user', error.message);
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 400, 'Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 400, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        token,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Error logging in', error.message);
  }
};

// ===== Profile =====
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const user = await User.findById(userId)
      .select('-password -loginAttempts -lockUntil')
      .populate({
        path: 'favorites',
        select: 'name type breed image category available status createdAt',
      });

    if (!user) return sendError(res, 404, 'User not found');

    return res.json({ success: true, data: user });
  } catch (error) {
    return sendError(res, 500, 'Error fetching profile', error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const updates = { ...(req.body || {}) };

    // Disallow sensitive fields here
    ['password', 'email', 'role', '_id', 'favorites'].forEach((f) => delete updates[f]);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!user) return sendError(res, 404, 'User not found');

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    return sendError(res, 400, 'Error updating profile', error.message);
  }
};

// ===== Favorites =====
const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const user = await User.findById(userId)
      .select('favorites')
      .populate({
        path: 'favorites',
        select: 'name type breed image category available status createdAt',
      });

    if (!user) return sendError(res, 404, 'User not found');

    return res.json({ success: true, data: user.favorites || [] });
  } catch (error) {
    return sendError(res, 500, 'Error fetching favorites', error.message);
  }
};

const addToFavorites = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const petId = req.params.petId;
    const oid = toObjectId(petId);
    if (!oid) return sendError(res, 400, 'Invalid pet ID');

    // Ensure pet exists
    const pet = await Pet.findById(oid).select('_id');
    if (!pet) return sendError(res, 404, 'Pet not found');

    // Atomic add without duplicates
    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: pet._id } },
      { new: true }
    )
      .select('favorites')
      .populate({ path: 'favorites', select: 'name type breed image category available status createdAt' });

    return res.json({
      success: true,
      message: 'Pet added to favorites',
      data: updated?.favorites || [],
    });
  } catch (error) {
    return sendError(res, 500, 'Error adding to favorites', error.message);
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const petId = req.params.petId;
    const oid = toObjectId(petId);
    if (!oid) return sendError(res, 400, 'Invalid pet ID');

    const updated = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: oid } },
      { new: true }
    )
      .select('favorites')
      .populate({ path: 'favorites', select: 'name type breed image category available status createdAt' });

    return res.json({
      success: true,
      message: 'Pet removed from favorites',
      data: updated?.favorites || [],
    });
  } catch (error) {
    return sendError(res, 500, 'Error removing from favorites', error.message);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
};
