// server/routes/pets.js - COMPLETE PETS ROUTES
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const { body, validationResult, param, query } = require('express-validator');

// ===== LOGGING UTILITY =====
const logger = {
  info: (message, ...args) => console.log(`ℹ️  ${new Date().toISOString()} - ${message}`, ...args),
  error: (message, ...args) => console.error(`❌ ${new Date().toISOString()} - ${message}`, ...args),
  warn: (message, ...args) => console.warn(`⚠️  ${new Date().toISOString()} - ${message}`, ...args),
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🐛 ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
};

// ===== VALIDATION MIDDLEWARE =====
const validatePetData = [
  body('name')
    .notEmpty()
    .withMessage('Pet name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Pet name must be between 1 and 100 characters')
    .trim()
    .escape(),
  
  body('type')
    .notEmpty()
    .withMessage('Pet type is required')
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
    .withMessage('Invalid pet type'),
  
  body('breed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Breed must be less than 100 characters')
    .trim()
    .escape(),
  
  body('age')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Age must be less than 50 characters')
    .trim()
    .escape(),
  
  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid size'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters')
    .trim(),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10,000'),
  
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters')
    .trim()
    .escape(),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  body('image')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Image path must be less than 500 characters')
];

const validatePetId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid pet ID format')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
    .withMessage('Invalid pet type'),
  
  query('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status'),
  
  query('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid size'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .trim()
    .escape()
];

// ===== HELPER FUNCTIONS =====
const enrichPetData = (pet) => {
  const petObj = pet.toObject ? pet.toObject() : pet;
  
  return {
    ...petObj,
    imageUrl: petObj.image ? 
      `https://storage.googleapis.com/furbabies-petstore/${petObj.image}` : null,
    hasImage: !!petObj.image,
    displayName: petObj.name || 'Unnamed Pet',
    isAvailable: petObj.status === 'available',
    daysSincePosted: Math.floor((new Date() - new Date(petObj.createdAt)) / (1000 * 60 * 60 * 24)),
    shortDescription: petObj.description ? 
      petObj.description.substring(0, 150) + (petObj.description.length > 150 ? '...' : '') : '',
    formattedPrice: petObj.price ? `$${petObj.price.toFixed(2)}` : 'Free'
  };
};

const buildFilterQuery = (filters) => {
  const query = {};
  
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.size) query.size = filters.size;
  if (filters.featured !== undefined) query.featured = filters.featured === 'true';
  if (filters.location) query.location = new RegExp(filters.location, 'i');
  
  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { breed: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') }
    ];
  }
  
  return query;
};

// ===== VALIDATION ERROR HANDLER =====
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc Get all pets with filtering, search, and pagination
// @route GET /api/pets
// @access Public
router.get('/', validateQueryParams, handleValidationErrors, async (req, res) => {
  try {
    logger.info('GET /api/pets - Fetching pets with filters:', req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = buildFilterQuery(req.query);
    
    // Build sort query
    let sortQuery = {};
    switch (req.query.sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'price-low':
        sortQuery = { price: 1 };
        break;
      case 'price-high':
        sortQuery = { price: -1 };
        break;
      case 'popular':
        sortQuery = { views: -1 };
        break;
      case 'name':
        sortQuery = { name: 1 };
        break;
      default:
        sortQuery = { featured: -1, createdAt: -1 };
    }

    logger.debug('Filter query:', filterQuery);
    logger.debug('Sort query:', sortQuery);

    // Execute queries
    const [pets, totalCount] = await Promise.all([
      Pet.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Pet.countDocuments(filterQuery)
    ]);

    // Enrich pet data
    const enrichedPets = pets.map(enrichPetData);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Found ${pets.length} pets (${totalCount} total)`);

    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
        limit
      },
      filters: req.query,
      message: `Found ${totalCount} pets`
    });

  } catch (error) {
    logger.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Get featured pets
// @route GET /api/pets/featured
// @access Public
router.get('/featured', async (req, res) => {
  try {
    logger.info('GET /api/pets/featured - Fetching featured pets');

    const limit = parseInt(req.query.limit) || 6;

    const featuredPets = await Pet.find({ 
      featured: true, 
      status: 'available' 
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const enrichedPets = featuredPets.map(enrichPetData);

    logger.info(`Found ${featuredPets.length} featured pets`);

    res.json({
      success: true,
      data: enrichedPets,
      count: featuredPets.length,
      message: 'Featured pets retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Get pet statistics
// @route GET /api/pets/stats
// @access Public
router.get('/stats', async (req, res) => {
  try {
    logger.info('GET /api/pets/stats - Fetching pet statistics');

    const [totalPets, availablePets, adoptedPets, typeStats] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: 'available' }),
      Pet.countDocuments({ status: 'adopted' }),
      Pet.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const stats = {
      total: totalPets,
      available: availablePets,
      adopted: adoptedPets,
      pending: totalPets - availablePets - adoptedPets,
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    logger.info('Pet statistics calculated:', stats);

    res.json({
      success: true,
      data: stats,
      message: 'Pet statistics retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching pet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet statistics',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Get single pet by ID
// @route GET /api/pets/:id
// @access Public
router.get('/:id', validatePetId, handleValidationErrors, async (req, res) => {
  try {
    logger.info(`GET /api/pets/${req.params.id} - Fetching single pet`);

    const pet = await Pet.findById(req.params.id).lean();

    if (!pet) {
      logger.warn(`Pet not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Increment view count
    await Pet.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } },
      { new: true }
    );

    const enrichedPet = enrichPetData(pet);

    logger.info(`Pet found: ${enrichedPet.displayName}`);

    res.json({
      success: true,
      data: enrichedPet,
      message: 'Pet retrieved successfully'
    });

  } catch (error) {
    logger.error('Error retrieving pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// @desc Create new pet (Admin only)
// @route POST /api/pets
// @access Private/Admin
router.post('/', protect, admin, validatePetData, handleValidationErrors, async (req, res) => {
  try {
    logger.info('POST /api/pets - Creating new pet:', req.body.name);

    // Create pet with defaults and standardized fields
    const petData = {
      name: req.body.name,
      type: req.body.type,
      breed: req.body.breed || '',
      age: req.body.age || 'Unknown',
      size: req.body.size || 'medium',
      gender: req.body.gender || 'unknown',
      description: req.body.description || '',
      image: req.body.image || '',
      category: req.body.category || req.body.type,
      price: req.body.price || 0,
      location: req.body.location || '',
      status: 'available', // Always start as available
      featured: req.body.featured || false,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      votes: {
        upvotes: 0,
        downvotes: 0
      }
    };

    const pet = new Pet(petData);
    await pet.save();

    const enrichedPet = enrichPetData(pet);

    logger.info(`Pet created successfully: ${pet._id}`);

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: enrichedPet
    });

  } catch (error) {
    logger.error('Error creating pet:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A pet with this information already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating pet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Update pet (Admin only)
// @route PUT /api/pets/:id
// @access Private/Admin
router.put('/:id', protect, admin, validatePetId, validatePetData, handleValidationErrors, async (req, res) => {
  try {
    logger.info(`PUT /api/pets/${req.params.id} - Updating pet`);

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      logger.warn(`Pet not found for update: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Update fields
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const enrichedPet = enrichPetData(updatedPet);

    logger.info(`Pet updated successfully: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: enrichedPet
    });

  } catch (error) {
    logger.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Update pet status (Admin only)
// @route PATCH /api/pets/:id/status
// @access Private/Admin
router.patch('/:id/status', protect, admin, validatePetId, [
  body('status')
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status')
], handleValidationErrors, async (req, res) => {
  try {
    logger.info(`PATCH /api/pets/${req.params.id}/status - Updating status to: ${req.body.status}`);

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { 
        status: req.body.status,
        updatedAt: new Date(),
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!pet) {
      logger.warn(`Pet not found for status update: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const enrichedPet = enrichPetData(pet);

    logger.info(`Pet status updated successfully: ${req.params.id} -> ${req.body.status}`);

    res.json({
      success: true,
      message: 'Pet status updated successfully',
      data: enrichedPet
    });

  } catch (error) {
    logger.error('Error updating pet status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Toggle pet featured status (Admin only)
// @route PATCH /api/pets/:id/featured
// @access Private/Admin
router.patch('/:id/featured', protect, admin, validatePetId, handleValidationErrors, async (req, res) => {
  try {
    logger.info(`PATCH /api/pets/${req.params.id}/featured - Toggling featured status`);

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      logger.warn(`Pet not found for featured toggle: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    pet.featured = !pet.featured;
    pet.updatedAt = new Date();
    pet.updatedBy = req.user._id;

    await pet.save();

    const enrichedPet = enrichPetData(pet);

    logger.info(`Pet featured status toggled: ${req.params.id} -> ${pet.featured}`);

    res.json({
      success: true,
      message: `Pet ${pet.featured ? 'featured' : 'unfeatured'} successfully`,
      data: enrichedPet
    });

  } catch (error) {
    logger.error('Error toggling pet featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet featured status',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Delete pet (Admin only)
// @route DELETE /api/pets/:id
// @access Private/Admin
router.delete('/:id', protect, admin, validatePetId, handleValidationErrors, async (req, res) => {
  try {
    logger.info(`DELETE /api/pets/${req.params.id} - Deleting pet`);

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      logger.warn(`Pet not found for deletion: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Store pet info for logging
    const petInfo = {
      id: pet._id,
      name: pet.name,
      type: pet.type
    };

    await Pet.findByIdAndDelete(req.params.id);

    logger.info(`Pet deleted successfully:`, petInfo);

    res.json({
      success: true,
      message: 'Pet deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    logger.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Bulk update pets (Admin only)
// @route PATCH /api/pets/bulk
// @access Private/Admin
router.patch('/bulk', protect, admin, [
  body('petIds')
    .isArray({ min: 1 })
    .withMessage('Pet IDs array is required')
    .custom((value) => {
      if (!value.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('All pet IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),
  body('updates')
    .isObject()
    .withMessage('Updates object is required')
    .custom((value) => {
      const allowedFields = ['status', 'featured', 'location', 'price'];
      const updateFields = Object.keys(value);
      if (!updateFields.some(field => allowedFields.includes(field))) {
        throw new Error('At least one valid update field is required');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    logger.info(`PATCH /api/pets/bulk - Bulk updating ${req.body.petIds.length} pets`);

    const { petIds, updates } = req.body;

    // Add metadata
    updates.updatedAt = new Date();
    updates.updatedBy = req.user._id;

    const result = await Pet.updateMany(
      { _id: { $in: petIds } },
      { $set: updates },
      { runValidators: true }
    );

    logger.info(`Bulk update completed: ${result.modifiedCount} pets modified`);

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} pets`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        updates
      }
    });

  } catch (error) {
    logger.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pets',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @desc Get pets by admin (Admin only)
// @route GET /api/pets/admin/all
// @access Private/Admin
router.get('/admin/all', protect, admin, validateQueryParams, handleValidationErrors, async (req, res) => {
  try {
    logger.info('GET /api/pets/admin/all - Admin fetching all pets');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filterQuery = buildFilterQuery(req.query);
    
    const [pets, totalCount] = await Promise.all([
      Pet.find(filterQuery)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Pet.countDocuments(filterQuery)
    ]);

    const enrichedPets = pets.map(pet => ({
      ...enrichPetData(pet),
      createdBy: pet.createdBy,
      updatedBy: pet.updatedBy
    }));

    const totalPages = Math.ceil(totalCount / limit);

    logger.info(`Admin retrieved ${pets.length} pets (${totalCount} total)`);

    res.json({
      success: true,
      data: enrichedPets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      message: `Retrieved ${totalCount} pets for admin`
    });

  } catch (error) {
    logger.error('Error fetching pets for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

module.exports = router;