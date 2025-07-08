// server/middleware/validation.js - UPDATED with Custom Pet ID Validation
const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Helper function to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// Helper function to validate custom pet ID format (p000, p001, p032, etc.)
const isValidCustomPetId = (id) => {
  const customPetIdRegex = /^p\d{3,}$/i; // p + 3 or more digits (case insensitive)
  return customPetIdRegex.test(id);
};

// Helper function to validate custom product ID format
const isValidCustomProductId = (id) => {
  const customProductIdRegex = /^prod_\d+$/i; // prod_ + digits
  return customProductIdRegex.test(id);
};

// =============================================================================
// USER VALIDATIONS
// =============================================================================

const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, apostrophes, and hyphens'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, apostrophes, and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('profile.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  handleValidationErrors
];

// =============================================================================
// PET VALIDATIONS
// =============================================================================

const validatePetCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Pet name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s'-]+$/)
    .withMessage('Pet name can only contain letters, numbers, spaces, apostrophes, and hyphens'),
  
  body('type')
    .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'reptile', 'other'])
    .withMessage('Pet type must be one of: dog, cat, bird, fish, rabbit, hamster, small-pet, reptile, other'),
  
  body('breed')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Breed must be between 1 and 100 characters'),
  
  body('age')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Age must be between 1 and 20 characters'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Gender must be male, female, or unknown'),
  
  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Size must be small, medium, large, or extra-large'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 99999 })
    .withMessage('Price must be a positive number and cannot exceed 99,999'),
  
  body('adoptionFee')
    .optional()
    .isFloat({ min: 0, max: 99999 })
    .withMessage('Adoption fee must be a positive number and cannot exceed 99,999'),
  
  body('category')
    .optional()
    .isIn(['dog', 'cat', 'aquatic', 'other', 'all'])
    .withMessage('Category must be dog, cat, aquatic, other, or all'),
  
  handleValidationErrors
];

const validatePetUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Pet name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s'-]+$/)
    .withMessage('Pet name can only contain letters, numbers, spaces, apostrophes, and hyphens'),
  
  body('type')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'reptile', 'other'])
    .withMessage('Pet type must be one of: dog, cat, bird, fish, rabbit, hamster, small-pet, reptile, other'),
  
  body('breed')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Breed must be between 1 and 100 characters'),
  
  body('age')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Age must be between 1 and 20 characters'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Gender must be male, female, or unknown'),
  
  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Size must be small, medium, large, or extra-large'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 99999 })
    .withMessage('Price must be a positive number and cannot exceed 99,999'),
  
  body('adoptionFee')
    .optional()
    .isFloat({ min: 0, max: 99999 })
    .withMessage('Adoption fee must be a positive number and cannot exceed 99,999'),
  
  body('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Status must be available, pending, adopted, or unavailable'),
  
  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean value'),
  
  handleValidationErrors
];

// =============================================================================
// CONTACT VALIDATIONS
// =============================================================================

const validateContactSubmission = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, apostrophes, and hyphens'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  handleValidationErrors
];

// =============================================================================
// PARAMETER VALIDATIONS - CUSTOM FOR YOUR DATA STRUCTURE
// =============================================================================

// MongoDB ObjectId validation (strict) - for users, etc.
const validateObjectId = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid MongoDB ObjectId format');
      }
      return true;
    }),
  
  handleValidationErrors
];

// 🎯 CUSTOM PET ID VALIDATION - Accepts YOUR pet ID format (p000, p001, p032, etc.)
const validatePetId = [
  param('id')
    .custom((value) => {
      if (!value || value.trim() === '') {
        throw new Error('Pet ID is required');
      }
      
      if (!isValidCustomPetId(value)) {
        throw new Error('Pet ID must be in format p000, p001, p032, etc.');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Flexible Pet ID validation - accepts BOTH MongoDB ObjectIds AND custom pet IDs
const validateFlexiblePetId = [
  param('id')
    .custom((value) => {
      if (!value || value.trim() === '') {
        throw new Error('Pet ID is required');
      }
      
      // Accept either MongoDB ObjectId OR custom pet ID format
      if (!isValidObjectId(value) && !isValidCustomPetId(value)) {
        throw new Error('Pet ID must be either a MongoDB ObjectId or custom pet ID (p000, p001, etc.)');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Alternative pet ID validation for route parameters named 'petId'
const validatePetIdParam = [
  param('petId')
    .custom((value) => {
      if (!value || value.trim() === '') {
        throw new Error('Pet ID is required');
      }
      
      if (!isValidCustomPetId(value)) {
        throw new Error('Pet ID must be in format p000, p001, p032, etc.');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Product ID validation
const validateProductId = [
  param('id')
    .custom((value) => {
      if (!value || value.trim() === '') {
        throw new Error('Product ID is required');
      }
      
      // Accept MongoDB ObjectId OR custom product ID format
      if (!isValidObjectId(value) && !isValidCustomProductId(value)) {
        throw new Error('Product ID must be either a MongoDB ObjectId or custom product ID (prod_001, etc.)');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// User ID validation (MongoDB ObjectId only)
const validateUserId = [
  param('userId')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('User ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  
  handleValidationErrors
];

// =============================================================================
// QUERY VALIDATIONS
// =============================================================================

const validatePetQuery = [
  query('category')
    .optional()
    .isIn(['dog', 'cat', 'aquatic', 'other', 'all'])
    .withMessage('Category must be dog, cat, aquatic, other, or all'),
  
  query('type')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'reptile', 'other'])
    .withMessage('Type must be dog, cat, bird, fish, rabbit, hamster, small-pet, reptile, or other'),
  
  query('age')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Age parameter is invalid'),
  
  query('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Size must be small, medium, large, or extra-large'),
  
  query('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Gender must be male, female, or unknown'),
  
  query('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Status must be available, pending, adopted, or unavailable'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be true or false'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive number'),
  
  query('sort')
    .optional()
    .isIn(['name', 'price-low', 'price-high', 'type', 'newest', 'oldest', 'popular', 'createdAt'])
    .withMessage('Sort must be name, price-low, price-high, type, newest, oldest, popular, or createdAt'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  handleValidationErrors
];

const validateProductQuery = [
  query('category')
    .optional()
    .isIn(['general', 'dog', 'cat', 'bird', 'fish', 'small-pet', 'other'])
    .withMessage('Category must be general, dog, cat, bird, fish, small-pet, or other'),
  
  query('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Brand must be between 1 and 50 characters'),
  
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('InStock must be true or false'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive number'),
  
  query('sort')
    .optional()
    .isIn(['name', 'price-low', 'price-high', 'brand', 'newest', 'oldest', 'popular'])
    .withMessage('Sort must be name, price-low, price-high, brand, newest, oldest, or popular'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  handleValidationErrors
];

// =============================================================================
// SANITIZATION MIDDLEWARE
// =============================================================================

const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove script tags and other potentially dangerous content
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };
  
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  if (req.params) {
    sanitizeObject(req.params);
  }
  
  next();
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // User validations
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  
  // Pet validations
  validatePetCreation,
  validatePetUpdate,
  validatePetQuery,
  
  // Product validations
  validateProductQuery,
  
  // Contact validations
  validateContactSubmission,
  
  // Parameter validations
  validateObjectId,          // Strict MongoDB ObjectId only
  validatePetId,            // 🎯 YOUR CUSTOM PET ID FORMAT (p000, p032, etc.)
  validateFlexiblePetId,    // Both MongoDB ObjectId AND custom pet ID
  validatePetIdParam,       // Custom pet ID for 'petId' parameter
  validateProductId,        // Flexible product ID validation
  validateUserId,           // Strict MongoDB ObjectId only
  
  // Helper functions (exported for testing or reuse)
  isValidObjectId,
  isValidCustomPetId,
  isValidCustomProductId,
  
  // Utility
  handleValidationErrors,
  sanitizeInput
};