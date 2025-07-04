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
      .select('name email createdAt');

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    // Get monthly adoption trends
    const adoptionTrends = await Pet.aggregate([
      {
        $match: {
          adoptedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$adoptedAt' },
            month: { $month: '$adoptedAt' },
            day: { $dayOfMonth: '$adoptedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
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
    const {
      search,
      category,
      status,
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

    if (status) {
      query.status = status;
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

    const pets = await Pet.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate('createdBy', 'name email')
      .populate('adoptedBy', 'name email');

    const totalPets = await Pet.countDocuments(query);
    const totalPages = Math.ceil(totalPets / limitNum);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPets,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Pets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
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

    // Populate the creator info
    await pet.populate('createdBy', 'name email');

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
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Update pet
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('adoptedBy', 'name email');

    res.json({
      success: true,
      data: updatedPet,
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
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if pet is adopted
    if (pet.status === 'adopted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete adopted pet'
      });
    }

    await Pet.findByIdAndDelete(req.params.id);

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

// POST /api/admin/pets/:id/adopt - Mark pet as adopted
router.post('/pets/:id/adopt', validateObjectId, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const pet = await Pet.findById(req.params.id);
    const user = await User.findById(userId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Pet is not available for adoption'
      });
    }

    // Mark pet as adopted
    await pet.markAsAdopted(userId);

    // Add to user's adopted pets
    user.adoptedPets.push({
      pet: pet._id,
      adoptedAt: new Date()
    });
    await user.save();

    res.json({
      success: true,
      message: 'Pet marked as adopted successfully'
    });
  } catch (error) {
    console.error('Error marking pet as adopted:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking pet as adopted',
      error: error.message
    });
  }
});

// GET /api/admin/reports - Generate various reports
router.get('/reports', async (req, res) => {
  try {
    const { type = 'summary', startDate, endDate } = req.query;

    // Set date range
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    switch (type) {
      case 'adoptions':
        reportData = await generateAdoptionReport(start, end);
        break;
      case 'users':
        reportData = await generateUserReport(start, end);
        break;
      case 'contacts':
        reportData = await generateContactReport(start, end);
        break;
      case 'pets':
        reportData = await generatePetReport(start, end);
        break;
      default:
        reportData = await generateSummaryReport(start, end);
    }

    res.json({
      success: true,
      data: reportData,
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// Helper functions for report generation
async function generateSummaryReport(startDate, endDate) {
  const [petStats, userStats, contactStats] = await Promise.all([
    Pet.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          adoptedPets: {
            $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] }
          }
        }
      }
    ]),
    User.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]),
    Contact.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          resolvedContacts: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  return {
    dateRange: { startDate, endDate },
    pets: petStats[0] || { totalPets: 0, adoptedPets: 0 },
    users: userStats[0] || { totalUsers: 0, activeUsers: 0 },
    contacts: contactStats[0] || { totalContacts: 0, resolvedContacts: 0 }
  };
}

async function generateAdoptionReport(startDate, endDate) {
  const adoptions = await Pet.find({
    adoptedAt: { $gte: startDate, $lte: endDate },
    status: 'adopted'
  })
    .populate('adoptedBy', 'name email')
    .populate('createdBy', 'name email')
    .sort({ adoptedAt: -1 });

  const monthlyAdoptions = await Pet.aggregate([
    {
      $match: {
        adoptedAt: { $gte: startDate, $lte: endDate },
        status: 'adopted'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$adoptedAt' },
          month: { $month: '$adoptedAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return {
    dateRange: { startDate, endDate },
    adoptions,
    monthlyTrends: monthlyAdoptions,
    totalAdoptions: adoptions.length
  };
}

async function generateUserReport(startDate, endDate) {
  const users = await User.find({
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .select('-password')
    .sort({ createdAt: -1 });

  const userGrowth = await User.aggregate([
    {
      $match: { createdAt: { $gte: startDate, $lte: endDate } }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return {
    dateRange: { startDate, endDate },
    users,
    growthTrends: userGrowth,
    totalUsers: users.length
  };
}

async function generateContactReport(startDate, endDate) {
  const contacts = await Contact.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: -1 });

  const statusDistribution = await Contact.aggregate([
    {
      $match: { createdAt: { $gte: startDate, $lte: endDate } }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    dateRange: { startDate, endDate },
    contacts,
    statusDistribution: statusDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalContacts: contacts.length
  };
}

async function generatePetReport(startDate, endDate) {
  const pets = await Pet.find({
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  const categoryDistribution = await Pet.aggregate([
    {
      $match: { createdAt: { $gte: startDate, $lte: endDate } }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    dateRange: { startDate, endDate },
    pets,
    categoryDistribution: categoryDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalPets: pets.length
  };
}

module.exports = router;