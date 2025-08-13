// server/routes/pets.js - ENHANCED WITH DEBUG ROUTES
const express = require('express');
const router = express.Router();

// For now, let's create a simple mock response to test the route
// You can replace this with your actual Pet model once the route is working

// Mock data for testing
const mockPets = [
  {
    _id: '1',
    name: 'Buddy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '2 years',
    status: 'available',
    featured: true,
    description: 'Friendly and energetic dog looking for a loving home.',
    imageUrl: null
  },
  {
    _id: '2',
    name: 'Whiskers',
    type: 'cat',
    breed: 'Persian',
    age: '1 year',
    status: 'available',
    featured: false,
    description: 'Calm and affectionate cat perfect for apartment living.',
    imageUrl: null
  },
  {
    _id: '3',
    name: 'Maverick',
    type: 'dog',
    breed: 'German Shepherd',
    age: '3 years',
    status: 'available',
    featured: true,
    description: 'Loyal and intelligent dog, great with families.',
    imageUrl: null
  },
  {
    _id: '4',
    name: 'Jax',
    type: 'dog',
    breed: 'Labrador',
    age: '1 year',
    status: 'available',
    featured: false,
    description: 'Playful puppy ready for training and adventure.',
    imageUrl: null
  }
];

// ===== DEBUG ROUTES FOR TESTING =====

// GET /api/pets/debug/sample - Used by debug helper
router.get('/debug/sample', (req, res) => {
  try {
    console.log('🐕 GET /api/pets/debug/sample - Query:', req.query);
    
    res.json({
      success: true,
      query: req.query,
      data: mockPets.slice(0, 2), // Return first 2 pets for testing
      message: 'Debug sample data - replace with database when available',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in debug sample:', error);
    res.status(500).json({
      success: false,
      message: 'Debug sample failed',
      error: error.message
    });
  }
});

// GET /api/pets - Get all pets with filtering
router.get('/', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets - Query params:', req.query);
    
    // For now, return mock data
    // TODO: Replace with actual database query when Pet model is available
    let pets = [...mockPets];
    
    // Apply basic filters
    if (req.query.type && req.query.type !== 'all') {
      pets = pets.filter(pet => pet.type === req.query.type);
    }
    
    if (req.query.status) {
      pets = pets.filter(pet => pet.status === req.query.status);
    }
    
    if (req.query.featured === 'true') {
      pets = pets.filter(pet => pet.featured === true);
    }
    
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim().toLowerCase();
      pets = pets.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm) ||
        pet.breed.toLowerCase().includes(searchTerm) ||
        pet.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Basic pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const paginatedPets = pets.slice(skip, skip + limit);
    
    console.log(`🐕 Returning ${paginatedPets.length} pets (filtered from ${pets.length} total)`);
    
    res.json({
      success: true,
      data: paginatedPets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(pets.length / limit),
        totalPets: pets.length,
        hasNext: skip + limit < pets.length,
        hasPrev: page > 1,
        total: pets.length
      },
      query: req.query,
      filterCounts: {
        type: {
          all: mockPets.length,
          dog: mockPets.filter(p => p.type === 'dog').length,
          cat: mockPets.filter(p => p.type === 'cat').length
        },
        status: {
          available: mockPets.filter(p => p.status === 'available').length
        },
        featured: mockPets.filter(p => p.featured).length
      },
      message: 'Using mock data - replace with database when available'
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// GET /api/pets/featured - Get featured pets
router.get('/featured', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/featured');
    
    const limit = parseInt(req.query.limit) || 6;
    const featuredPets = mockPets.filter(pet => pet.featured).slice(0, limit);
    
    console.log(`🐕 Returning ${featuredPets.length} featured pets`);
    
    res.json({
      success: true,
      data: featuredPets,
      count: featuredPets.length,
      message: 'Using mock data - replace with database when available'
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/pets/featured:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
});

// GET /api/pets/:id - Get single pet
router.get('/:id', async (req, res) => {
  try {
    console.log('🐕 GET /api/pets/:id - ID:', req.params.id);
    
    const pet = mockPets.find(p => p._id === req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      data: pet,
      message: 'Using mock data - replace with database when available'
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/pets/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// Test route to verify the router is working
router.get('/test/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Pets router is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;