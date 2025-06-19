const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Public routes
router.post('/', contactController.submitContact);

// Admin routes (you can add admin middleware later)
router.get('/', auth, contactController.getAllContacts);

module.exports = router;