// server/routes/pets.js - ENHANCED VERSION with Random Featured Selection
const express = require('express');
const Pet = require('../models/Pet');
const { protect, admin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const router = express.Router();

// ⭐ NEW: Get random featured pets for home page
router.get('/featured', async (req, res) => {
  try {
    console.log('🏠 GET /api/pets/featured - Random selection requested');
    
    const limit = parseInt(req.query.limit) || 4;
    
    // Use MongoDB aggregation for true random selection
    const featuredPets = await Pet.aggregate([
      { 
        $match: { 
          featured: true, 
          status: 'available' 
        } 
      },
      { $sample: { size: limit } }, // ⭐ This provides random selection
      {
        $addFields: {
          imageUrl: {
            $cond: {
              if: { $ne: ["$image", null] },
              then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
              else: null
            }
          },
          hasImage: { $ne: ["$image", null] },
          displayName: { $ifNull: ["$name", "Unnamed Pet"] },
          isAvailable: { $eq: ["$status", "available"] }
        }
      }
    ]);

    console.log(`🏠 Returning ${featuredPets.length} random featured pets`);
    
    res.json({
      success: true,
      data: featuredPets,
      count: featuredPets.length,
      message: `${featuredPets.length} featured pets selected randomly`
    });

  } catch (error) {
    console.error('❌ Error fetching random featured pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// ⭐ ENHANCED: Get all pets with advanced filtering and sorting
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);

    // Build query object
    const query = { status: 'available' }; // Only show available pets by default

    // Type filter (dog, cat, fish, bird, small-pet)
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Category filter (dog, cat, aquatic, other)
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Breed filter
    if (req.query.breed && req.query.breed !== 'all') {
      query.breed = new RegExp(req.query.breed, 'i');
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
        { type: searchRegex }
      ];
    }

    // Age filter
    if (req.query.age && req.query.age !== 'all') {
      const ageRegex = new RegExp(req.query.age, 'i');
      query.age = ageRegex;
    }

    // Size filter
    if (req.query.size && req.query.size !== 'all') {
      query.size = req.query.size;
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== 'all') {
      query.gender = req.query.gender;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'age':
        sortOptions = { age: 1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, createdAt: -1 };
        break;
      case 'random':
        // For random sorting, we'll use aggregation pipeline
        break;
    }

    let pets;
    let total;

    if (req.query.sort === 'random') {
      // Use aggregation for random sorting
      const pipeline = [
        { $match: query },
        { $sample: { size: limit } },
        {
          $addFields: {
            imageUrl: {
              $cond: {
                if: { $ne: ["$image", null] },
                then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
                else: null
              }
            },
            hasImage: { $ne: ["$image", null] },
            displayName: { $ifNull: ["$name", "Unnamed Pet"] },
            isAvailable: { $eq: ["$status", "available"] }
          }
        }
      ];
      
      pets = await Pet.aggregate(pipeline);
      total = await Pet.countDocuments(query);
    } else {
      // Regular query with sorting
      total = await Pet.countDocuments(query);
      
      const dbPets = await Pet.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .lean();

      // Add computed fields
      pets = dbPets.map(pet => ({
        ...pet,
        imageUrl: pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null,
        hasImage: !!pet.image,
        displayName: pet.name || 'Unnamed Pet',
        isAvailable: pet.status === 'available',
        daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
      }));
    }

    console.log(`🐕 Found ${pets.length} pets (Total: ${total})`);

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
        type: req.query.type || 'all',
        breed: req.query.breed || 'all',
        category: req.query.category || 'all',
        search: req.query.search || '',
        sort: req.query.sort || 'newest',
        featured: req.query.featured || 'all'
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

// Get single pet by ID
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
      isAvailable: pet.status === 'available'
    };

    console.log('🐕 Pet found:', enrichedPet.displayName);
    
    res.json({
      success: true,
      data: enrichedPet
    });
    
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
});

// Get pet types for filtering
router.get('/meta/types', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/meta/types');
    
    const types = await Pet.distinct('type', { status: 'available' });
    
    const typesWithCount = await Promise.all(
      types.map(async (type) => {
        const count = await Pet.countDocuments({ 
          type: type, 
          status: 'available' 
        });
        return { 
          _id: type, 
          name: type.charAt(0).toUpperCase() + type.slice(1), 
          count,
          value: type 
        };
      })
    );

    console.log(`🐕 Found ${typesWithCount.length} pet types`);
    
    res.json({ 
      success: true, 
      data: typesWithCount.filter(t => t.count > 0)
    });
  } catch (error) {
    console.error('❌ Error fetching pet types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pet types', 
      error: error.message 
    });
  }
});

// Get pet breeds by type
router.get('/meta/breeds/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`🐕 GET /api/pets/meta/breeds/${type}`);
    
    const breeds = await Pet.distinct('breed', { 
      type: type,
      status: 'available' 
    });
    
    const breedsWithCount = await Promise.all(
      breeds.map(async (breed) => {
        const count = await Pet.countDocuments({ 
          type: type,
          breed: breed,
          status: 'available'
        });
        return { name: breed, count, value: breed };
      })
    );

    console.log(`🐕 Found ${breedsWithCount.length} breeds for ${type}`);
    
    res.json({ 
      success: true, 
      data: breedsWithCount.filter(b => b.count > 0).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('❌ Error fetching breeds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching breeds', 
      error: error.message 
    });
  }
});

module.exports = router;