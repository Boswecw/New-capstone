// server/routes/pets.js - FIXED VERSION WITH FEATURED FILTER
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// ============================================
// VALIDATION FUNCTIONS
// ============================================

// Validate MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid ID format" 
    });
  }
  next();
};

// ============================================
// FEATURED PETS ENDPOINT (Must come before /:id route)
// ============================================
router.get('/featured', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/featured');

    const limit = parseInt(req.query.limit) || 10;
    
    const featuredPets = await Pet.find({ 
      featured: true, 
      status: 'available' 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    // Add computed fields
    const enrichedPets = featuredPets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: true
    }));

    console.log(`🐕 Found ${enrichedPets.length} featured pets`);

    res.json({
      success: true,
      data: enrichedPets,
      count: enrichedPets.length,
      message: `Found ${enrichedPets.length} featured pets`
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

// ============================================
// GET ALL PETS WITH ADVANCED FILTERING
// ============================================
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = {};

    // ✅ FEATURED FILTER - This was missing!
    if (req.query.featured === "true") {
      query.featured = true;
      console.log('🐕 Filtering for featured pets');
    }

    // Status/Availability filter
    if (req.query.available !== undefined && req.query.available !== 'all') {
      query.status = req.query.available === 'true' ? 'available' : { $ne: 'available' };
      console.log('🐕 Filtering by availability:', query.status);
    }

    // Default to available pets if no status specified
    if (!req.query.available && !req.query.status) {
      query.status = 'available';
      console.log('🐕 Defaulting to available pets');
    }

    // Type filter (dog, cat, fish, etc.)
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
      console.log('🐕 Filtering by type:', req.query.type);
    }

    // Category filter (same as type, but different field name)
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
      console.log('🐕 Filtering by category:', req.query.category);
    }

    // Breed filter
    if (req.query.breed && req.query.breed !== 'all') {
      query.breed = new RegExp(req.query.breed, 'i'); // Case insensitive
      console.log('🐕 Filtering by breed:', req.query.breed);
    }

    // Size filter
    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
      console.log('🐕 Filtering by size:', req.query.size);
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
      console.log('🐕 Filtering by gender:', req.query.gender);
    }

    // Age filter
    if (req.query.age && req.query.age !== 'all') {
      // You can expand this logic based on your age categories
      const ageRegex = new RegExp(req.query.age, 'i');
      query.age = ageRegex;
      console.log('🐕 Filtering by age:', req.query.age);
    }

    // Text search across multiple fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
        { type: searchRegex },
        { category: searchRegex }
      ];
      console.log('🐕 Text search filter:', req.query.search);
    }

    console.log('🐕 Built query:', JSON.stringify(query, null, 2));

    // Pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    console.log('🐕 Pagination:', { limit, page, skip });

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
      case 'name': 
        sortOptions = { name: 1 }; 
        console.log('🐕 Sorting by name A-Z');
        break;
      case 'age': 
        sortOptions = { age: 1 }; 
        console.log('🐕 Sorting by age (youngest first)');
        break;
      case 'newest': 
        sortOptions = { createdAt: -1 }; 
        console.log('🐕 Sorting by newest first');
        break;
      case 'oldest': 
        sortOptions = { createdAt: 1 }; 
        console.log('🐕 Sorting by oldest first');
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        console.log('🐕 Sorting by featured first');
        break;
      default:
        console.log('🐕 Using default sort (newest first)');
    }

    // Execute query with error handling
    let pets;
    let total;
    
    try {
      // Get total count for pagination
      total = await Pet.countDocuments(query);
      
      // Get paginated pets
      pets = await Pet.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean(); // Use lean() for better performance
        
      console.log(`🐕 Found ${pets.length} pets (Total: ${total})`);
      
      // Log first few pets for debugging
      if (pets.length > 0) {
        console.log('🐕 Sample pets:', pets.slice(0, 3).map(p => ({ 
          id: p._id, 
          name: p.name, 
          featured: p.featured, 
          status: p.status 
        })));
      }
      
    } catch (dbError) {
      console.error('🐕 Database error:', dbError);
      throw dbError;
    }

    // Add computed fields to each pet
    pets = pets.map(pet => ({
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    // Return success response
    res.json({
      success: true,
      data: pets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + pets.length < total
      },
      filters: {
        featured: req.query.featured || 'false',
        type: req.query.type || 'all',
        breed: req.query.breed || 'all',
        category: req.query.category || 'all',
        available: req.query.available || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest'
      },
      message: `Found ${pets.length} pets matching your criteria`
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

// ============================================
// GET SINGLE PET BY ID
// ============================================
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - Pet ID:', req.params.id);
    
    const pet = await Pet.findById(req.params.id).lean();

    if (!pet) {
      console.log('🐕 Pet not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }

    // Add computed fields
    const enrichedPet = {
      ...pet,
      imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
      hasImage: !!pet.image,
      displayName: pet.name || 'Unnamed Pet',
      isAvailable: pet.status === 'available',
      daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    };

    // Increment view count if field exists
    if (pet.views !== undefined) {
      await Pet.findByIdAndUpdate(pet._id, { $inc: { views: 1 } });
      console.log('🐕 Incremented view count');
    }

    console.log('🐕 Pet found:', enrichedPet.displayName);

    res.json({ 
      success: true, 
      data: enrichedPet 
    });

  } catch (error) {
    console.error('❌ Error retrieving pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving pet', 
      error: error.message 
    });
  }
});

module.exports = router;