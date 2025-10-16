const express = require('express');
const router = express.Router();
const {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateUser } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, login);
router.post('/register', validateUser, register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
