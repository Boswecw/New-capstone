// server/middleware/validation.js - UPDATED to support both pet and product custom IDs
const { body, param, query, validationResult } = require("express-validator");
const mongoose = require('mongoose');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// User validation rules
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  handleValidationErrors,
];

const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

const validateUserProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("profile.phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("profile.bio")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Bio cannot exceed 200 characters"),

  handleValidationErrors,
];

// Pet validation rules
const validatePetCreation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Pet name must be between 1 and 50 characters"),

  body("type")
    .isIn([
      "dog",
      "cat",
      "bird",
      "fish",
      "rabbit",
      "hamster",
      "small-pet",
      "other",
    ])
    .withMessage(
      "Pet type must be one of: dog, cat, bird, fish, rabbit, hamster, small-pet, other"
    ),

  body("breed")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Breed must be between 1 and 50 characters"),

  body("age")
    .isInt({ min: 0, max: 30 })
    .withMessage("Age must be a number between 0 and 30"),

  body("gender")
    .optional()
    .isIn(["male", "female", "unknown"])
    .withMessage("Gender must be male, female, or unknown"),

  body("size")
    .optional()
    .isIn(["small", "medium", "large", "extra-large"])
    .withMessage("Size must be small, medium, large, or extra-large"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),

  body("adoptionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Adoption fee must be a positive number"),

  handleValidationErrors,
];

const validatePetUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Pet name must be between 1 and 50 characters"),

  body("type")
    .optional()
    .isIn([
      "dog",
      "cat",
      "bird",
      "fish",
      "rabbit",
      "hamster",
      "small-pet",
      "other",
    ])
    .withMessage(
      "Pet type must be one of: dog, cat, bird, fish, rabbit, hamster, small-pet, other"
    ),

  body("breed")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Breed must be between 1 and 50 characters"),

  body("age")
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage("Age must be a number between 0 and 30"),

  body("status")
    .optional()
    .isIn(["available", "pending", "adopted", "not-available"])
    .withMessage(
      "Status must be available, pending, adopted, or not-available"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),

  handleValidationErrors,
];

// ✅ UPDATED: Product validation rules
const validateProductCreation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Product name must be between 1 and 100 characters"),

  body("category")
    .isIn([
      "food",
      "toys", 
      "accessories",
      "health",
      "grooming",
      "bedding",
      "other"
    ])
    .withMessage(
      "Category must be one of: food, toys, accessories, health, grooming, bedding, other"
    ),

  body("brand")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Brand must be between 1 and 50 characters"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean"),

  handleValidationErrors,
];

const validateProductUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Product name must be between 1 and 100 characters"),

  body("category")
    .optional()
    .isIn([
      "food",
      "toys", 
      "accessories",
      "health",
      "grooming",
      "bedding",
      "other"
    ])
    .withMessage(
      "Category must be one of: food, toys, accessories, health, grooming, bedding, other"
    ),

  body("brand")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Brand must be between 1 and 50 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be a boolean"),

  handleValidationErrors,
];

// Contact validation rules
const validateContactSubmission = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("subject")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject cannot exceed 200 characters"),

  body("message")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),

  handleValidationErrors,
];

// ✅ UPDATED: Pet ID validation that accepts both MongoDB ObjectIds AND custom pet IDs
const validatePetId = [
  param("id")
    .notEmpty()
    .withMessage("Pet ID is required")
    .custom((value) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      const isCustomPetId = /^p\d{3}$/.test(value); // Matches p001, p003, p025, etc.
      
      if (!isValidObjectId && !isCustomPetId) {
        throw new Error(
          `Invalid pet ID format. Expected MongoDB ObjectId or custom format like p001, p003. Received: ${value}`
        );
      }
      
      return true;
    }),

  handleValidationErrors,
];

// ✅ NEW: Product ID validation that accepts both MongoDB ObjectIds AND custom product IDs
const validateProductId = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .custom((value) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      const isCustomProductId = /^(prod|p)\d{3}$/.test(value); // Matches prod001, p001, etc.
      
      if (!isValidObjectId && !isCustomProductId) {
        throw new Error(
          `Invalid product ID format. Expected MongoDB ObjectId or custom format like prod001, p001. Received: ${value}`
        );
      }
      
      return true;
    }),

  handleValidationErrors,
];

// Standard MongoDB ObjectId validation (for users, etc.)
const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format - must be a valid MongoDB ObjectId"),

  handleValidationErrors,
];

const validateUserId = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),

  handleValidationErrors,
];

// Query validation for pets
const validatePetQuery = [
  query("category")
    .optional()
    .isIn(["dog", "cat", "aquatic", "other", "all"])
    .withMessage("Category must be dog, cat, aquatic, other, or all"),

  query("type")
    .optional()
    .isIn([
      "dog",
      "cat",
      "bird",
      "fish",
      "rabbit",
      "hamster",
      "small-pet",
      "other",
    ])
    .withMessage(
      "Type must be dog, cat, bird, fish, rabbit, hamster, small-pet, or other"
    ),

  query("age")
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage("Age must be a number between 0 and 30"),

  query("size")
    .optional()
    .isIn(["small", "medium", "large", "extra-large"])
    .withMessage("Size must be small, medium, large, or extra-large"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number"),

  handleValidationErrors,
];

// ✅ NEW: Query validation for products
const validateProductQuery = [
  query("category")
    .optional()
    .isIn(["food", "toys", "accessories", "health", "grooming", "bedding", "other", "all"])
    .withMessage("Category must be food, toys, accessories, health, grooming, bedding, other, or all"),

  query("brand")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Brand must be between 1 and 50 characters"),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),

  query("inStock")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("inStock must be true, false, or all"),

  query("featured")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("featured must be true, false, or all"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number"),

  handleValidationErrors,
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === "string") {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  // User validations
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,

  // Pet validations
  validatePetCreation,
  validatePetUpdate,
  validatePetQuery,

  // ✅ NEW: Product validations
  validateProductCreation,
  validateProductUpdate,
  validateProductQuery,

  // Contact validations
  validateContactSubmission,

  // Parameter validations
  validateObjectId,        // For MongoDB ObjectIds only (users, etc.)
  validatePetId,          // For pet IDs (accepts both ObjectIds and custom p001, p003, etc.)
  validateProductId,      // ✅ NEW: For product IDs (accepts both ObjectIds and custom prod001, p001, etc.)
  validateUserId,

  // Utility
  handleValidationErrors,
  sanitizeInput,
};