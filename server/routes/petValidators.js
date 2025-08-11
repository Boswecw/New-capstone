// server/routes/petValidators.js
const { body, param, query, validationResult } = require('express-validator');

const validatePetData = [
  body('name')
    .notEmpty()
    .withMessage('Pet name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Pet name must be between 1 and 100 characters')
    .trim()
    .escape(),

  body('type')
    .notEmpty()
    .withMessage('Pet type is required')
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
    .withMessage('Invalid pet type'),

  body('breed')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Breed must be less than 100 characters')
    .trim()
    .escape(),

  body('age')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Age must be less than 50 characters')
    .trim()
    .escape(),

  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid size'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Invalid gender'),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters')
    .trim(),

  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10,000'),

  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters')
    .trim()
    .escape(),

  body('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),

  body('image')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Image path must be less than 500 characters')
];

const validatePetId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid pet ID format')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('type')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
    .withMessage('Invalid pet type'),

  query('status')
    .optional()
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status'),

  query('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large'])
    .withMessage('Invalid size'),

  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),

  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .trim()
    .escape()
];

const validateStatusUpdate = [
  body('status')
    .isIn(['available', 'pending', 'adopted', 'unavailable'])
    .withMessage('Invalid status')
];

const validateBulkUpdate = [
  body('petIds')
    .isArray({ min: 1 })
    .withMessage('Pet IDs array is required')
    .custom((value) => {
      if (!value.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('All pet IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),
  body('updates')
    .isObject()
    .withMessage('Updates object is required')
    .custom((value) => {
      const allowedFields = ['status', 'featured', 'location', 'price'];
      const updateFields = Object.keys(value);
      if (!updateFields.some(field => allowedFields.includes(field))) {
        throw new Error('At least one valid update field is required');
      }
      return true;
    })
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validatePetData,
  validatePetId,
  validateQueryParams,
  validateStatusUpdate,
  validateBulkUpdate,
  handleValidationErrors
};
