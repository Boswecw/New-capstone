// Add this route to server/routes/pets.js (after the existing routes)

// GET /api/pets/:id - Get single pet by ID
router.get('/:id', validateObjectId, optionalAuth, async (req, res) => {
  try {
    console.log(`🔍 Fetching pet with ID: ${req.params.id}`);
    
    const pet = await Pet.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('adoptedBy', 'name email');

    if (!pet) {
      console.log(`❌ Pet not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Increment view count
    pet.views = (pet.views || 0) + 1;
    await pet.save();

    console.log(`✅ Pet found: ${pet.name} (${pet.type})`);
    
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message
    });
  }
});

// POST /api/pets/:id/vote - Vote on a pet (requires authentication)
router.post('/:id/vote', protect, validateObjectId, async (req, res) => {
  try {
    const { voteType } = req.body;
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on unavailable pets'
      });
    }

    // Initialize votes object if it doesn't exist
    if (!pet.votes) {
      pet.votes = { up: 0, down: 0 };
    }

    // Check if user already voted (simple check by user ID)
    const userVotes = pet.userVotes || [];
    const existingVote = userVotes.find(vote => vote.userId.toString() === req.user._id.toString());
    
    if (existingVote) {
      // Remove old vote
      if (existingVote.voteType === 'up') {
        pet.votes.up = Math.max(0, pet.votes.up - 1);
      } else {
        pet.votes.down = Math.max(0, pet.votes.down - 1);
      }
      
      // Add new vote if different
      if (existingVote.voteType !== voteType) {
        pet.votes[voteType] += 1;
        existingVote.voteType = voteType;
      } else {
        // Remove vote entirely if same type
        pet.userVotes = userVotes.filter(vote => vote.userId.toString() !== req.user._id.toString());
      }
    } else {
      // Add new vote
      pet.votes[voteType] += 1;
      if (!pet.userVotes) pet.userVotes = [];
      pet.userVotes.push({
        userId: req.user._id,
        voteType,
        votedAt: new Date()
      });
    }

    await pet.save();

    res.json({
      success: true,
      data: {
        votes: pet.votes,
        userVote: voteType
      },
      message: `Vote ${voteType} recorded successfully`
    });
  } catch (error) {
    console.error('Error voting on pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing vote',
      error: error.message
    });
  }
});