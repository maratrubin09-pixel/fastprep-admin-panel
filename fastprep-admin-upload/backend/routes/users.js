const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserActivity
} = require('../controllers/userController');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { validateUser, validateUUID, validatePagination } = require('../middleware/validation');
const { logUserActivity } = require('../middleware/logging');

// All routes require authentication
router.use(authenticateToken);

// All routes require users permission
router.use(checkPermission('users', 'read'));

// Get all users with pagination and search
router.get('/', validatePagination, getAllUsers);

// Get user by ID
router.get('/:id', validateUUID('id'), getUserById);

// Create new user (requires create permission)
router.post('/', 
  checkPermission('users', 'create'),
  validateUser,
  logUserActivity('created', 'user'),
  createUser
);

// Update user (requires update permission)
router.put('/:id',
  validateUUID('id'),
  checkPermission('users', 'update'),
  logUserActivity('updated', 'user'),
  updateUser
);

// Delete user (requires delete permission)
router.delete('/:id',
  validateUUID('id'),
  checkPermission('users', 'delete'),
  logUserActivity('deleted', 'user'),
  deleteUser
);

// Get user activity logs
router.get('/:id/activity',
  validateUUID('id'),
  validatePagination,
  getUserActivity
);

module.exports = router;
