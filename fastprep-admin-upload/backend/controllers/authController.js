const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { generateTokens } = require('../middleware/auth');
const config = require('../config/config');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, roleId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      roleId
    });

    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    const { accessToken, refreshToken } = generateTokens(userWithRole);

    res.status(201).json({
      message: 'User created successfully',
      user: userWithRole.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    // In a more sophisticated implementation, you might want to blacklist the token
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone
    });

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  updateProfile
};
