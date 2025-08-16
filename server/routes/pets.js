// server/routes/pets.js - FIXED VERSION FOR CUSTOM IDs (like p051)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Flexible ID validation - accepts both ObjectId and custom formats
const validateId = (req, res, next) => {
  const id = req.params.id;
  
  // Allow both MongoDB ObjectIds and custom IDs (like p051, pet123, etc.)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isValidCustomId = /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 3;
  
  if (!isValidObjectId && !isValidCustomId) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid pet ID format" 
    });
  }
  
  next();
};

// Add image URL to pet data
const addImageUrl = (pet, type = 'pet') => {
  if (!pet) return pet;
  
  return {
    ...pet,
    imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
    hasImage: !!pet.image,
    displayName: pet.name || 'Unnamed Pet'
  };
};

// ============================================
// SPECIFIC ROUTES FIRST (BEFORE /:id)
// ============================================

// GET /api/pets/meta/categories
router.get('/meta/categories', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/meta/categories');
    
    const categories = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categoriesWithNames = categories.map(cat => ({
      name: cat._id || 'Uncategorized',
      count: cat.count,
      value: cat._id
    }));

    console.log(`🐕 Found ${categoriesWithNames.length} categories`);
    
    res.json({ 
      success: true, 
      data: categoriesWithNames 
    });
  } catch (error) {
    console.error('❌ Error fetching pet categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// GET /api/pets/meta/types
router.get('/meta/types', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/meta/types');
    
    const types = await Pet.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const typesWithNames = types.map(type => ({
      name: type._id || 'Other',
      count: type.count,
      value: type._id,
      displayName: type._id ? type._id.charAt(0).toUpperCase() + type._id.slice(1) : 'Other'
    }));

    console.log(`🐕 Found ${typesWithNames.length} types`);
    
    res.json({ 
      success: true, 
      data: typesWithNames 
    });
  } catch (error) {
    console.error('❌ Error fetching pet types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching types', 
      error: error.message 
    });
  }
});

// GET /api/pets/featured - Featured pets endpoint
router.get('/featured', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured pets first
    let pets = await Pet.find({ 
      status: 'available', 
      featured: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Fill with regular pets if not enough featured ones
    if (pets.length < limit) {
      const additionalPets = await Pet.find({
        status: 'available',
        featured: { $ne: true },
        _id: { $nin: pets.map(p => p._id) }
      })
      .sort({ createdAt: -1 })
      .limit(limit - pets.length)
      .lean();
      
      pets = [...pets, ...additionalPets];
    }

    // Add image URLs
    const petsWithImages = pets.map(pet => addImageUrl(pet, 'pet'));

    console.log(`✅ Returning ${petsWithImages.length} featured pets`);

    res.json({
      success: true,
      data: petsWithImages,
      count: petsWithImages.length
    });

  } catch (error) {
    console.error('❌ Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// GET /api/pets/stats/summary - Pet statistics
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/stats/summary');
    
    const stats = await Pet.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          adopted: { $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] } },
          avgAge: { $avg: '$age' }
        }
      }
    ]);

    const summary = stats[0] || {
      total: 0,
      available: 0,
      pending: 0,
      adopted: 0,
      avgAge: 0
    };

    console.log('✅ Pet stats calculated');

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Error fetching pet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet statistics',
      error: error.message
    });
  }
});

// ============================================
// MAIN ROUTES
// ============================================

// GET /api/pets - Get all pets with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets');
    console.log('🐕 Query params:', req.query);

    const {
      page = 1,
      limit = 12,
      type,
      status = 'available',
      age,
      breed,
      gender,
      category,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Category filter  
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Age filter
    if (age && age !== 'all') {
      if (age === 'young') query.age = { $lt: 2 };
      else if (age === 'adult') query.age = { $gte: 2, $lte: 7 };
      else if (age === 'senior') query.age = { $gt: 7 };
    }
    
    // Gender filter
    if (gender && gender !== 'all') {
      query.gender = gender;
    }
    
    // Breed filter
    if (breed && breed !== 'all') {
      query.breed = { $regex: breed, $options: 'i' };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🐕 Query object:', query);

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [pets, total] = await Promise.all([
      Pet.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Pet.countDocuments(query)
    ]);

    // Add image URLs
    const petsWithImages = pets.map(pet => addImageUrl(pet, 'pet'));

    console.log(`✅ Found ${pets.length} pets (${total} total)`);

    res.json({
      success: true,
      data: petsWithImages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + pets.length < total
      },
      filters: {
        type: type || 'all',
        status: status || 'available',
        age: age || 'all',
        breed: breed || 'all',
        gender: gender || 'all',
        category: category || 'all',
        search: search || '',
        sort,
        order
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// ============================================
// INDIVIDUAL PET BY ID (MUST BE LAST)
// ============================================

// GET /api/pets/:id - Get single pet by ID (supports both ObjectId and custom IDs)
router.get('/:id', validateId, async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🐕 GET /api/pets/${petId} - Fetching pet details`);
    
    let pet = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(petId)) {
      console.log(`🐕 Searching by ObjectId: ${petId}`);
      pet = await Pet.findById(petId).lean();
    }
    
    // If not found, try to find by custom ID field
    if (!pet) {
      console.log(`🐕 Searching by custom ID field: ${petId}`);
      pet = await Pet.findOne({ 
        $or: [
          { id: petId },           // Custom id field
          { petId: petId },        // Alternative custom id field
          { customId: petId },     // Another alternative
          { name: petId }          // Sometimes name is used as ID
        ]
      }).lean();
    }
    
    if (!pet) {
      console.log(`❌ Pet not found with ID: ${petId}`);
      
      // Debug: Show available pet IDs
      const availablePets = await Pet.find({}, { _id: 1, id: 1, petId: 1, name: 1 }).limit(10).lean();
      console.log('🐕 Available pet IDs (first 10):', availablePets.map(p => ({
        _id: p._id,
        id: p.id,
        petId: p.petId,
        name: p.name
      })));
      
      return res.status(404).json({
        success: false,
        message: "Pet not found",
        searchedId: petId,
        availableIds: availablePets.map(p => p._id || p.id || p.petId || p.name).filter(Boolean).slice(0, 5)
      });
    }

    // Add image URL and computed fields
    const petWithImage = addImageUrl(pet, 'pet');
    
    console.log(`✅ Pet found: ${petWithImage.name} (${petWithImage._id})`);
    
    res.json({
      success: true,
      data: petWithImage
    });

  } catch (error) {
    console.error(`❌ Error fetching pet ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pet details",
      error: error.message,
      searchedId: req.params.id
    });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// POST /api/pets - Create new pet (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    console.log('🐕 POST /api/pets - Creating new pet');
    console.log('🐕 Request body:', req.body);

    const petData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const pet = new Pet(petData);
    await pet.save();

    const petWithImage = addImageUrl(pet.toObject(), 'pet');

    console.log("✅ Pet created successfully:", pet._id);

    res.status(201).json({
      success: true,
      data: petWithImage,
      message: "Pet created successfully",
    });

  } catch (error) {
    console.error('❌ Error creating pet:', error);
    res.status(400).json({
      success: false,
      message: "Failed to create pet",
      error: error.message
    });
  }
});

// PUT /api/pets/:id - Update pet (Admin only)
router.put('/:id', protect, admin, validateId, async (req, res) => {
  try {
    console.log("🐕 Updating pet:", req.params.id);

    const petId = req.params.id;
    let pet = null;

    // Try ObjectId first, then custom ID
    if (mongoose.Types.ObjectId.isValid(petId)) {
      pet = await Pet.findByIdAndUpdate(
        petId,
        { ...req.body, updatedBy: req.user._id },
        { new: true, runValidators: true }
      );
    } else {
      pet = await Pet.findOneAndUpdate(
        { $or: [{ id: petId }, { petId: petId }, { customId: petId }] },
        { ...req.body, updatedBy: req.user._id },
        { new: true, runValidators: true }
      );
    }

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    const petWithImage = addImageUrl(pet.toObject(), 'pet');

    console.log("✅ Pet updated successfully");

    res.json({
      success: true,
      data: petWithImage,
      message: "Pet updated successfully",
    });

  } catch (error) {
    console.error('❌ Error updating pet:', error);
    res.status(400).json({
      success: false,
      message: "Failed to update pet",
      error: error.message
    });
  }
});

// DELETE /api/pets/:id - Delete pet (Admin only)
router.delete('/:id', protect, admin, validateId, async (req, res) => {
  try {
    console.log("🐕 Deleting pet:", req.params.id);

    const petId = req.params.id;
    let pet = null;

    // Try ObjectId first, then custom ID
    if (mongoose.Types.ObjectId.isValid(petId)) {
      pet = await Pet.findByIdAndDelete(petId);
    } else {
      pet = await Pet.findOneAndDelete({
        $or: [{ id: petId }, { petId: petId }, { customId: petId }]
      });
    }

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    console.log("✅ Pet deleted successfully");

    res.json({
      success: true,
      message: "Pet deleted successfully",
    });

  } catch (error) {
    console.error('❌ Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pet",
      error: error.message
    });
  }
});

module.exports = router;