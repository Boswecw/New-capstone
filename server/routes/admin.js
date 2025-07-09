const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { protect, admin } = require('../middleware/auth');
const { validatePetCreation, validatePetUpdate, validateObjectId } = require('../middleware/validation');

// Middleware to ensure all admin routes are protected
router.use(protect);
router.use(admin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get pet statistics
    const petStats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          availablePets: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          adoptedPets: {
            $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] }
          },
          pendingPets: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          newUsersThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get contact statistics
    const contactStats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          newContacts: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          pendingContacts: {
            $sum: {
              $cond: [
                { $in: ['$status', ['new', 'read']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent activities
    const recentPets = await Pet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type status createdAt');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    // Get adoption trends (last 30 days)
    const adoptionTrends = await Pet.aggregate([
      {
        $match: {
          status: 'adopted',
          adoptedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$adoptedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get pet category distribution
    const categoryDistribution = await Pet.aggregate([
      {
        $match: { status: 'available' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const dashboardData = {
      stats: {
        pets: petStats[0] || { totalPets: 0, availablePets: 0, adoptedPets: 0, pendingPets: 0 },
        users: userStats[0] || { totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0 },
        contacts: contactStats[0] || { totalContacts: 0, newContacts: 0, pendingContacts: 0 }
      },
      recentActivities: {
        pets: recentPets,
        users: recentUsers,
        contacts: recentContacts
      },
      charts: {
        adoptionTrends,
        categoryDistribution: categoryDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// GET /api/admin/users - Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const {
      search,
      role,
      isActive,
      limit = 20,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'email':
        sortOptions.email = 1;
        break;
      case 'role':
        sortOptions.role = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .select('-password')
      .populate('adoptedPets.pet', 'name type breed');

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/admin/pets - Get all pets for admin management
router.get('/pets', async (req, res) => {
  try {
    console.log('🔍 Admin pets route hit with query:', req.query);
    
    const {
      search,
      category,
      type,
      breed,
      status,
      available,
      age,
      limit = 20,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (breed) {
      query.breed = { $regex: breed, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (available !== undefined && available !== '') {
      query.available = available === 'true';
    }

    if (age) {
      query.age = parseInt(age);
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'age':
        sortOptions.age = 1;
        break;
      case 'status':
        sortOptions.status = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log('🔍 MongoDB query:', query);

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate('createdBy', 'name email')
      .populate('adoptedBy', 'name email');

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    console.log('✅ Found pets:', totalPets);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      message: 'Pets retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching pets for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// POST /api/admin/pets - Add new pet
router.post('/pets', validatePetCreation, async (req, res) => {
  try {
    const petData = {
      ...req.body,
      createdBy: req.user._id
    };

    const pet = new Pet(petData);
    await pet.save();

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet added successfully'
    });
  } catch (error) {
    console.error('Error adding pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding pet',
      error: error.message
    });
  }
});

// PUT /api/admin/pets/:id - Update pet
router.put('/pets/:id', validateObjectId, validatePetUpdate, async (req, res) => {
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
      data: pet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet',
      error: error.message
    });
  }
});

// DELETE /api/admin/pets/:id - Delete pet
router.delete('/pets/:id', validateObjectId, async (req, res) => {
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
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: error.message
    });
  }
});

// ===============================
// CONTACT MANAGEMENT ROUTES
// ===============================

// GET /api/admin/contacts - Get all contacts for admin
router.get('/contacts', async (req, res) => {
  try {
    const {
      status,
      search,
      limit = 20,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Build query object
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'email':
        sortOptions.email = 1;
        break;
      case 'status':
        sortOptions.status = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Execute query
    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate('response.respondedBy', 'name email');

    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limitNum);

    // Get status counts for stats
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      message: 'Contact submissions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message
    });
  }
});

// GET /api/admin/contacts/:id - Get single contact submission
router.get('/contacts/:id', validateObjectId, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('response.respondedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Mark as read if it's new
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact submission retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact',
      error: error.message
    });
  }
});

// PUT /api/admin/contacts/:id/status - Update contact status
router.put('/contacts/:id/status', validateObjectId, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'read', 'responded', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, responded, resolved'
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    contact.status = status;
    await contact.save();

    res.json({
      success: true,
      data: contact,
      message: 'Contact status updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact status',
      error: error.message
    });
  }
});

// PUT /api/admin/contacts/:id/respond - Add response to contact
router.put('/contacts/:id/respond', validateObjectId, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Add response
    contact.response = {
      message: message.trim(),
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    // Update status to responded
    contact.status = 'responded';
    await contact.save();

    // Populate the response
    await contact.populate('response.respondedBy', 'name email');

    res.json({
      success: true,
      data: contact,
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding response',
      error: error.message
    });
  }
});

// DELETE /api/admin/contacts/:id - Delete contact submission
router.delete('/contacts/:id', validateObjectId, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', validateObjectId, async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: user, admin, moderator'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
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
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', validateObjectId, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
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
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', validateObjectId, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;