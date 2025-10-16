const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { validateMessage, validateUUID, validatePagination } = require('../middleware/validation');
const { logUserActivity } = require('../middleware/logging');

// All routes require authentication
router.use(authenticateToken);

// All routes require messages permission
router.use(checkPermission('messages', 'read'));

// Get all conversations across all platforms
router.get('/conversations', validatePagination, messageController.getAllConversations);

// Get conversation statistics
router.get('/stats', messageController.getConversationStats);

// Get platform-specific conversations
router.get('/conversations/:platform', validatePagination, messageController.getPlatformConversations);

// Get conversation by ID
router.get('/conversations/:id', validateUUID('id'), messageController.getConversationById);

// Get messages for a conversation
router.get('/conversations/:id/messages', validateUUID('id'), validatePagination, messageController.getMessages);

// Send message (requires create permission)
router.post('/send',
  checkPermission('messages', 'create'),
  logUserActivity('sent', 'message'),
  messageController.sendMessage
);

// Assign conversation (requires update permission)
router.put('/conversations/:id/assign',
  validateUUID('id'),
  checkPermission('messages', 'update'),
  logUserActivity('assigned', 'conversation'),
  messageController.assignConversation
);

// Update conversation status (requires update permission)
router.put('/conversations/:id/status',
  validateUUID('id'),
  checkPermission('messages', 'update'),
  logUserActivity('updated', 'conversation'),
  messageController.updateConversationStatus
);

// Mark conversation as read
router.put('/conversations/:id/read',
  validateUUID('id'),
  messageController.markAsRead
);

module.exports = router;
