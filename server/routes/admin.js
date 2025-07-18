// server/routes/admin.js - UPDATED WITH PRODUCT ROUTES
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Product = require('../models/Product');  // ✅ ADDED: Product model import
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

    // ✅ ADDED: Get product statistics
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockProducts: {
            $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] }
          },
          averagePrice: { $avg: '$price' }
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

    // ✅ ADDED: Get recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category price inStock createdAt');

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
        $match: {
          status: 'available'
        }
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
        contacts: contactStats[0] || { totalContacts: 0, newContacts: 0, pendingContacts: 0 },
        products: productStats[0] || { totalProducts: 0, inStockProducts: 0, outOfStockProducts: 0, averagePrice: 0 } // ✅ ADDED
      },
      recentActivities: {
        pets: recentPets,
        users: recentUsers,
        contacts: recentContacts,
        products: recentProducts // ✅ ADDED
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
      status,
      available,
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

    if (status) {
      query.status = status;
    }

    if (available !== undefined && available !== '') {
      query.available = available === 'true';
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

// ========================================
// ✅ PRODUCT MANAGEMENT ROUTES - NEW SECTION
// ========================================

// GET /api/admin/products - Get all products for admin management
router.get('/products', async (req, res) => {
  try {
    console.log('🛒 Admin products route hit with query:', req.query);
    
    const {
      search,
      category,
      brand,
      inStock,
      priceRange,
      limit = 20,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = brand;
    }

    if (inStock !== undefined && inStock !== '') {
      query.inStock = inStock === 'true';
    }

    // Price range filtering
    if (priceRange) {
      switch (priceRange) {
        case 'under25':
          query.price = { $lt: 25 };
          break;
        case '25to50':
          query.price = { $gte: 25, $lte: 50 };
          break;
        case '50to100':
          query.price = { $gte: 50, $lte: 100 };
          break;
        case 'over100':
          query.price = { $gt: 100 };
          break;
      }
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
      case 'price':
        sortOptions.price = 1;
        break;
      case 'category':
        sortOptions.category = 1;
        break;
      case 'brand':
        sortOptions.brand = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    console.log('🛒 MongoDB query:', query);

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .populate('createdBy', 'name email');

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum);

    console.log('✅ Found products:', totalProducts);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        total: totalProducts, // Add for consistency with frontend
        pages: totalPages,    // Add for consistency with frontend
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching products for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// POST /api/admin/products - Add new product
router.post('/products', async (req, res) => {
  try {
    console.log('🛒 Creating new product:', req.body);

    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    console.log('✅ Product created successfully:', product._id);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🛒 Updating product:', req.params.id);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Product updated successfully');

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🛒 Deleting product:', req.params.id);

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Product deleted successfully');

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// GET /api/admin/products/stats - Get product statistics
router.get('/products/stats', async (req, res) => {
  try {
    console.log('📊 Fetching product statistics...');

    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ inStock: true });
    const outOfStockProducts = await Product.countDocuments({ inStock: false });
    
    // Category breakdown
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Brand breakdown
    const brandStats = await Product.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Price ranges
    const priceRanges = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 25, 50, 100, 1000],
          default: 'over1000',
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          inStockProducts,
          outOfStockProducts,
          stockPercentage: totalProducts > 0 ? ((inStockProducts / totalProducts) * 100).toFixed(1) : 0
        },
        categories: categoryStats,
        brands: brandStats,
        priceRanges
      },
      message: 'Product statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching product statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
});

// ========================================
// EXISTING ROUTES CONTINUE BELOW...
// ========================================

// GET /api/admin/reports - Generate various reports
router.get('/reports', async (req, res) => {
  try {
    const { type = 'summary', startDate, endDate } = req.query;

    // Set date range
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    switch (type) {
      case 'adoption':
        reportData = await generateAdoptionReport(start, end);
        break;
      case 'user':
        reportData = await generateUserReport(start, end);
        break;
      case 'contact':
        reportData = await generateContactReport(start, end);
        break;
      case 'product': // ✅ ADDED: Product report
        reportData = await generateProductReport(start, end);
        break;
      default:
        reportData = await generateSummaryReport(start, end);
    }

    res.json({
      success: true,
      data: reportData,
      message: `${type} report generated successfully`
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

// Helper functions for reports
const generateSummaryReport = async (start, end) => {
  const pets = await Pet.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const users = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const contacts = await Contact.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const products = await Product.countDocuments({ createdAt: { $gte: start, $lte: end } }); // ✅ ADDED

  return { pets, users, contacts, products, period: { start, end } };
};

const generateAdoptionReport = async (start, end) => {
  const adoptions = await Pet.find({
    status: 'adopted',
    adoptedAt: { $gte: start, $lte: end }
  }).populate('adoptedBy', 'name email');

  return { adoptions, count: adoptions.length };
};

const generateUserReport = async (start, end) => {
  const users = await User.find({
    createdAt: { $gte: start, $lte: end }
  }).select('-password');

  return { users, count: users.length };
};

const generateContactReport = async (start, end) => {
  const contacts = await Contact.find({
    createdAt: { $gte: start, $lte: end }
  });

  return { contacts, count: contacts.length };
};

// ✅ ADDED: Product report helper
const generateProductReport = async (start, end) => {
  const products = await Product.find({
    createdAt: { $gte: start, $lte: end }
  });

  const categoryBreakdown = await Product.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
  ]);

  return { products, count: products.length, categoryBreakdown };
};

module.exports = router;