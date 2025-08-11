// server/controllers/petController.js
const Pet = require('../models/Pet');

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

// ===== CONTROLLER FUNCTIONS =====
const getPets = async (req, res) => {
  try {
    logger.info('GET /api/pets - Fetching pets with filters:', req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filterQuery = buildFilterQuery(req.query);

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

    const [pets, totalCount] = await Promise.all([
      Pet.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Pet.countDocuments(filterQuery)
    ]);

    const enrichedPets = pets.map(enrichPetData);

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
};

const getFeaturedPets = async (req, res) => {
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
};

const getPetStats = async (req, res) => {
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
};

const getPetById = async (req, res) => {
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
};

const createPet = async (req, res) => {
  try {
    logger.info('POST /api/pets - Creating new pet:', req.body.name);

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
      status: 'available',
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
};

const updatePet = async (req, res) => {
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

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

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
};

const updatePetStatus = async (req, res) => {
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
};

const togglePetFeatured = async (req, res) => {
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
};

const deletePet = async (req, res) => {
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
};

const bulkUpdatePets = async (req, res) => {
  try {
    logger.info(`PATCH /api/pets/bulk - Bulk updating ${req.body.petIds.length} pets`);

    const { petIds, updates } = req.body;

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
};

const getAllPetsAdmin = async (req, res) => {
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
};

module.exports = {
  getPets,
  getFeaturedPets,
  getPetStats,
  getPetById,
  createPet,
  updatePet,
  updatePetStatus,
  togglePetFeatured,
  deletePet,
  bulkUpdatePets,
  getAllPetsAdmin
};
