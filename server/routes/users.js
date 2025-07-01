const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
console.log('Type of auth middleware:', typeof auth);

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/favorites', auth, userController.getFavorites);
router.post('/favorites/:petId', auth, userController.addToFavorites);
router.delete('/favorites/:petId', auth, userController.removeFromFavorites);

module.exports = router;
