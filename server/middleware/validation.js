// ===== VALIDATION MIDDLEWARE =====
// File: server/middleware/validation.js (CREATE NEW FILE)

const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateProductFilters = [
  query('featured').optional().isBoolean().withMessage('featured must be true or false'),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
  query('priceMin').optional().isNumeric().withMessage('priceMin must be a number'),
  query('priceMax').optional().isNumeric().withMessage('priceMax must be a number'),
  query('category').optional().isIn(['food', 'toys', 'accessories', 'health', 'grooming', 'beds', 'carriers', 'clothing']).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('skip').optional().isInt({ min: 0 }).withMessage('skip must be >= 0'),
  handleValidationErrors
];

const validatePetFilters = [
  query('featured').optional().isBoolean().withMessage('featured must be true or false'),
  query('status').optional().isIn(['available', 'adopted', 'pending']).withMessage('Invalid status'),
  query('type').optional().isIn(['dog', 'cat', 'bird', 'rabbit', 'other']).withMessage('Invalid type'),
  query('age').optional().isIn(['puppy', 'kitten', 'young', 'adult', 'senior']).withMessage('Invalid age'),
  query('size').optional().isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Invalid size'),
  query('gender').optional().isIn(['male', 'female']).withMessage('Invalid gender'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('skip').optional().isInt({ min: 0 }).withMessage('skip must be >= 0'),
  handleValidationErrors
];

module.exports = {
  validateProductFilters,
  validatePetFilters,
  handleValidationErrors
};

// Run the migration script
if (require.main === module) {
  fixProductDataTypes();
}