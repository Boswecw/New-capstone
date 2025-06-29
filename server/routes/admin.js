const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Pet = require('../models/Pet');
const User = require('../models/User');
const Contact = require('../models/Contact');

// Apply admin auth to all routes
router.use(auth);
router.use(adminAuth);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({ available: true });
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    
    // Recent activity
    const recentPets = await Pet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username');
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');
    
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalPets,
          availablePets,
          totalUsers,
          totalContacts,
          newContacts
        },
        recent: {
          pets: recentPets,
          users: recentUsers,
          contacts: recentContacts
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// Get all pets for admin
router.get('/pets', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, available } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (available !== undefined) {
      filter.available = available === 'true';
    }
    
    const pets = await Pet.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Pet.countDocuments(filter);
    
    res.json({
      success: true,
      data: pets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// Update pet
router.put('/pets/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: pet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating pet',
      error: error.message
    });
  }
});

// Delete pet
router.delete('/pets/:id', async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: error.message
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// Get all contacts
router.get('/contacts', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }
    
    const contacts = await Contact.find(filter)
      .populate('response.respondedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Contact.countDocuments(filter);
    
    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message
    });
  }
});

// Respond to contact
router.put('/contacts/:id/respond', async (req, res) => {
  try {
    const { message } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    contact.response = {
      message,
      respondedBy: req.user.id,
      respondedAt: new Date()
    };
    contact.status = 'responded';
    
    await contact.save();
    
    res.json({
      success: true,
      message: 'Response sent successfully',
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending response',
      error: error.message
    });
  }
});

// Update contact status
router.put('/contacts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
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
    res.status(400).json({
      success: false,
      message: 'Error updating contact status',
      error: error.message
    });
  }
});

module.exports = router;