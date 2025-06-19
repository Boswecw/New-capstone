const Pet = require('../models/Pet');
const User = require('../models/User');

// Get all pets with filtering and sorting
const getAllPets = async (req, res) => {
  try {
    const { type, size, minPrice, maxPrice, sort, search } = req.query;
    
    let filter = { available: true };
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (size) {
      filter.size = size;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption.price = 1;
        break;
      case 'price-high':
        sortOption.price = -1;
        break;
      case 'newest':
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }
    
    const pets = await Pet.find(filter)
      .sort(sortOption)
      .populate('createdBy', 'username')
      .populate('ratings.user', 'username');
    
    res.json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
};

// Get featured pets
const getFeaturedPets = async (req, res) => {
  try {
    const featuredPets = await Pet.find({ available: true })
      .sort({ 'votes.up': -1, createdAt: -1 })
      .limit(6)
      .populate('ratings.user', 'username');
    
    res.json({
      success: true,
      data: featuredPets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured pets',
      error: error.message
    });
  }
};

// Get pets by type
const getPetsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const pets = await Pet.find({ type, available: true })
      .sort({ createdAt: -1 })
      .populate('ratings.user', 'username');
    
    res.json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pets by type',
      error: error.message
    });
  }
};

// Get single pet by ID
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('ratings.user', 'username');
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
};

// Create new pet (authenticated users only)
const createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const newPet = new Pet(petData);
    const savedPet = await newPet.save();
    
    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: savedPet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating pet',
      error: error.message
    });
  }
};

// Vote on pet
const votePet = async (req, res) => {
  try {
    const { voteType } = req.body;
    const petId = req.params.id;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const existingVote = user.votedPets.find(vote => vote.pet.toString() === petId);
    
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Remove existing vote if any
    if (existingVote) {
      if (existingVote.voteType === 'up') {
        pet.votes.up -= 1;
      } else {
        pet.votes.down -= 1;
      }
      user.votedPets = user.votedPets.filter(vote => vote.pet.toString() !== petId);
    }
    
    // Add new vote if different from existing or if no existing vote
    if (!existingVote || existingVote.voteType !== voteType) {
      if (voteType === 'up') {
        pet.votes.up += 1;
      } else {
        pet.votes.down += 1;
      }
      user.votedPets.push({ pet: petId, voteType });
    }
    
    await pet.save();
    await user.save();
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        votes: pet.votes,
        userVote: voteType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
};

// Rate pet
const ratePet = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const petId = req.params.id;
    const userId = req.user.id;
    
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    // Check if user already rated this pet
    const existingRatingIndex = pet.ratings.findIndex(
      r => r.user.toString() === userId
    );
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      pet.ratings[existingRatingIndex].rating = rating;
      pet.ratings[existingRatingIndex].comment = comment;
    } else {
      // Add new rating
      pet.ratings.push({
        user: userId,
        rating,
        comment
      });
    }
    
    await pet.save();
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        averageRating: pet.averageRating,
        totalRatings: pet.ratings.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error submitting rating',
      error: error.message
    });
  }
};

module.exports = {
  getAllPets,
  getFeaturedPets,
  getPetsByType,
  getPetById,
  createPet,
  votePet,
  ratePet
};