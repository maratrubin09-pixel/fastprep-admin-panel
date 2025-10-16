const express = require('express');
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getDefaultPermissions
} = require('../controllers/roleController');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { validateUUID, validatePagination } = require('../middleware/validation');
const { logUserActivity } = require('../middleware/logging');

// All routes require authentication
router.use(authenticateToken);

// All routes require roles permission
router.use(checkPermission('roles', 'read'));

// Get default permissions structure
router.get('/permissions/default', getDefaultPermissions);

// Get all roles with pagination and search
router.get('/', validatePagination, getAllRoles);

// Get role by ID
router.get('/:id', validateUUID('id'), getRoleById);

// Create new role (requires create permission)
router.post('/',
  checkPermission('roles', 'create'),
  logUserActivity('created', 'role'),
  createRole
);

// Update role (requires update permission)
router.put('/:id',
  validateUUID('id'),
  checkPermission('roles', 'update'),
  logUserActivity('updated', 'role'),
  updateRole
);

// Delete role (requires delete permission)
router.delete('/:id',
  validateUUID('id'),
  checkPermission('roles', 'delete'),
  logUserActivity('deleted', 'role'),
  deleteRole
);

module.exports = router;
