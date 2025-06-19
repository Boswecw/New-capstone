const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', petController.getAllPets);
router.get('/featured', petController.getFeaturedPets);
router.get('/type/:type', petController.getPetsByType);
router.get('/:id', petController.getPetById);

// Protected routes (require authentication)
router.post('/', auth, petController.createPet);
router.post('/:id/vote', auth, petController.votePet);
router.post('/:id/rate', auth, petController.ratePet);

module.exports = router;