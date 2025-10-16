const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation
const validateUser = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  body('roleId')
    .isUUID()
    .withMessage('Valid role ID is required'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Customer validation
const validateCustomer = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'])
    .withMessage('Invalid status'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social', 'advertisement', 'cold_call', 'other'])
    .withMessage('Invalid source'),
  handleValidationErrors
];

// Lead validation
const validateLead = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  body('source')
    .isIn(['website', 'referral', 'social', 'advertisement', 'cold_call', 'other'])
    .withMessage('Invalid source'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  handleValidationErrors
];

// Task validation
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('assignedTo')
    .isUUID()
    .withMessage('Valid assigned user ID is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('conversationId')
    .isUUID()
    .withMessage('Valid conversation ID is required'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video', 'location'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort field must be alphabetic'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUser,
  validateLogin,
  validateCustomer,
  validateLead,
  validateTask,
  validateMessage,
  validateUUID,
  validatePagination
};
