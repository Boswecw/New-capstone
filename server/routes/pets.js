// server/routes/pets.js - COMPLETE FILE WITH OBJECTID CASTING FIX
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// ===== HELPER FUNCTIONS =====
const addImageUrl = (pet, type = 'pet') => {
  if (!pet) return pet;
  
  return {
    ...pet,
    imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
    hasImage: !!pet.image,
    displayName: pet.name || 'Unnamed Pet',
    isAvailable: pet.status === 'available',
    isAdopted: pet.status === 'adopted',
    statusDisplay: pet.status === 'adopted' ? 'Adopted' : 
                   pet.status === 'available' ? 'Available for Adoption' : 
                   pet.status || 'Unknown Status'
  };
};

// ===== VALIDATION FUNCTIONS =====
const validatePetData = (req, res, next) => {
  const { name, type, breed, description } = req.body;
  if (!name || !type || !breed || !description) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, type, breed, and description are required" 
    });
  }
  next();
};

// ===== METADATA ROUTES (Must come before /:id route) =====

// @desc Get pet categories
// @route GET /api/pets/meta/categories
// @access Public
router.get('/meta/categories', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/meta/categories');
    
    const categories = await Pet.aggregate([
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

// @desc Get pet types
// @route GET /api/pets/meta/types
// @access Public
router.get('/meta/types', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/meta/types');
    
    const types = await Pet.aggregate([
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

// @desc Get featured pets
// @route GET /api/pets/featured
// @access Public
router.get('/featured', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    
    // Get featured pets (both available and adopted)
    const pets = await Pet.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const petsWithImages = pets.map(pet => addImageUrl(pet));

    console.log(`🐕 Found ${pets.length} featured pets`);

    res.json({
      success: true,
      data: petsWithImages,
      count: pets.length
    });
  } catch (error) {
    console.error('❌ Error fetching featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured pets',
      error: error.message
    });
  }
});

// ===== MAIN ROUTES =====

// @desc Get all pets with filtering and pagination
// @route GET /api/pets
// @access Public
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = {};
    
    // Extract query parameters
    const {
      type,
      breed, 
      category,
      status,
      available,
      age,
      gender,
      size,
      search,
      featured,
      page = 1,
      limit = 12,
      sort = 'newest'
    } = req.query;

    // Type filter
    if (type && type !== 'all') {
      query.type = type;
      console.log('🐕 Filtering by type:', type);
    }

    // Breed filter
    if (breed && breed !== 'all') {
      query.breed = { $regex: breed, $options: 'i' };
      console.log('🐕 Filtering by breed:', breed);
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
      console.log('🐕 Filtering by category:', category);
    }

    // Status filter - SHOW ALL by default, filter only if specifically requested
    if (status && status !== 'all') {
      query.status = status;
      console.log('🐕 Filtering by status:', status);
    } else if (available === 'true') {
      query.status = 'available';
      console.log('🐕 Showing only available pets');
    }
    // If no status filter, show ALL pets (available, adopted, etc.)

    // Age filter
    if (age && age !== 'all') {
      query.age = { $regex: age, $options: 'i' };
      console.log('🐕 Filtering by age:', age);
    }

    // Gender filter
    if (gender && gender !== 'all') {
      query.gender = gender;
      console.log('🐕 Filtering by gender:', gender);
    }

    // Size filter
    if (size && size !== 'all') {
      query.size = size;
      console.log('🐕 Filtering by size:', size);
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
      console.log('🐕 Showing only featured pets');
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
      console.log('🐕 Search term:', search);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default newest first
    
    switch (sort) {
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'age_asc':
        sortOptions = { age: 1 };
        break;
      case 'age_desc':
        sortOptions = { age: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    console.log('🐕 MongoDB query:', JSON.stringify(query, null, 2));
    console.log('🐕 Sort options:', sortOptions);

    // Execute query
    const [pets, total] = await Promise.all([
      Pet.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Pet.countDocuments(query)
    ]);

    // Add image URLs to all pets
    const petsWithImages = pets.map(pet => addImageUrl(pet));

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
        breed: breed || 'all',
        category: category || 'all',
        status: status || 'all',
        available: available || 'all',
        age: age || 'all',
        gender: gender || 'all',
        size: size || 'all',
        search: search || '',
        featured: featured || 'all',
        sort: sort || 'newest'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
});

// ===== INDIVIDUAL PET BY ID - FIXED TO BYPASS OBJECTID CASTING =====
// @desc Get single pet by ID
// @route GET /api/pets/:id
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🔍 SEARCHING FOR PET: ${petId}`);
    
    // ✅ Use native MongoDB query to bypass Mongoose ObjectId casting
    const db = mongoose.connection.db;
    const petsCollection = db.collection('pets');
    
    // Find the pet using native MongoDB query (no ObjectId casting)
    const pet = await petsCollection.findOne({ _id: petId });
    
    if (!pet) {
      console.log(`❌ PET ${petId} NOT FOUND`);
      
      // Get all pets to show available IDs
      const allPets = await petsCollection.find({}, { projection: { _id: 1, name: 1, status: 1 } }).limit(20).toArray();
      console.log('📋 ALL PETS IN DATABASE:', allPets.map(p => `${p._id} (${p.name})`));
      
      return res.status(404).json({
        success: false,
        message: `Pet ${petId} not found`,
        searchedId: petId,
        availableIds: allPets.map(p => p._id).slice(0, 10),
        totalPets: allPets.length,
        debug: {
          searchedFor: petId,
          totalInDatabase: allPets.length,
          firstFew: allPets.slice(0, 5).map(p => ({
            id: p._id,
            name: p.name,
            status: p.status
          }))
        }
      });
    }

    console.log(`✅ FOUND PET: ${pet.name} (${pet.status})`);
    
    // Add image URL and computed fields
    const petWithImage = {
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      isAdopted: pet.status === 'adopted',
      statusDisplay: pet.status === 'adopted' ? 'Adopted' : 
                     pet.status === 'available' ? 'Available for Adoption' : 
                     pet.status || 'Unknown Status'
    };
    
    res.json({
      success: true,
      data: petWithImage
    });

  } catch (error) {
    console.error(`❌ ERROR FINDING PET ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// ===== ADMIN ROUTES (Protected) =====

// @desc Create new pet (Admin only)
// @route POST /api/pets
// @access Private/Admin
router.post('/', protect, admin, validatePetData, async (req, res) => {
  try {
    console.log('🐕 POST /api/pets - Creating new pet');
    console.log('🐕 Request body:', req.body);

    const petData = {
      ...req.body,
      createdBy: req.user._id,
      createdAt: new Date()
    };

    const pet = new Pet(petData);
    await pet.save();

    const petWithImage = addImageUrl(pet.toObject());

    console.log('🐕 Pet created:', pet._id);

    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      data: petWithImage
    });
  } catch (error) {
    console.error("❌ Error creating pet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pet",
      error: error.message
    });
  }
});

// @desc Update pet (Admin only)
// @route PUT /api/pets/:id
// @access Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    console.log('🐕 PUT /api/pets/:id - Updating pet:', req.params.id);

    const updateData = { ...req.body };
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found"
      });
    }

    const petWithImage = addImageUrl(pet.toObject());

    console.log('🐕 Pet updated successfully');

    res.json({
      success: true,
      message: "Pet updated successfully",
      data: petWithImage
    });
  } catch (error) {
    console.error("❌ Error updating pet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pet",
      error: error.message
    });
  }
});

// @desc Delete pet (Admin only)
// @route DELETE /api/pets/:id
// @access Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    console.log('🐕 DELETE /api/pets/:id - Deleting pet:', req.params.id);

    const pet = await Pet.findByIdAndDelete(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found"
      });
    }

    console.log('🐕 Pet deleted successfully');

    res.json({
      success: true,
      message: "Pet deleted successfully",
      data: pet
    });
  } catch (error) {
    console.error("❌ Error deleting pet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pet",
      error: error.message
    });
  }
});

// @desc Rate pet (Public)
// @route POST /api/pets/:id/rate
// @access Public
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    console.log('🐕 POST /api/pets/:id/rate - Rating pet:', req.params.id, 'Rating:', rating);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Update rating
    const currentTotal = (pet.rating || 0) * (pet.ratingCount || 0);
    const newCount = (pet.ratingCount || 0) + 1;
    const newRating = (currentTotal + rating) / newCount;

    pet.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
    pet.ratingCount = newCount;

    await pet.save();

    console.log(`🐕 Pet rated: ${pet.name} - New rating: ${pet.rating} (${pet.ratingCount} ratings)`);

    res.json({
      success: true,
      message: `Successfully rated ${pet.name}`,
      data: {
        rating: pet.rating,
        ratingCount: pet.ratingCount,
        petId: pet._id
      }
    });

  } catch (error) {
    console.error('❌ Error rating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing rating',
      error: error.message
    });
  }
});

module.exports = router;