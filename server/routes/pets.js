// server/routes/pets.js - Router for pet endpoints
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

const {
  validatePetData,
  validatePetId,
  validateQueryParams,
  validateStatusUpdate,
  validateBulkUpdate,
  handleValidationErrors
} = require('./petValidators');

const {
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
} = require('../controllers/petController');

// Public routes
router.get('/', validateQueryParams, handleValidationErrors, getPets);
router.get('/featured', getFeaturedPets);
router.get('/stats', getPetStats);
router.get('/:id', validatePetId, handleValidationErrors, getPetById);

// Admin routes
router.post('/', protect, admin, validatePetData, handleValidationErrors, createPet);
router.put('/:id', protect, admin, validatePetId, validatePetData, handleValidationErrors, updatePet);
router.patch('/:id/status', protect, admin, validatePetId, validateStatusUpdate, handleValidationErrors, updatePetStatus);
router.patch('/:id/featured', protect, admin, validatePetId, handleValidationErrors, togglePetFeatured);
router.delete('/:id', protect, admin, validatePetId, handleValidationErrors, deletePet);
router.patch('/bulk', protect, admin, validateBulkUpdate, handleValidationErrors, bulkUpdatePets);
router.get('/admin/all', protect, admin, validateQueryParams, handleValidationErrors, getAllPetsAdmin);

module.exports = router;
