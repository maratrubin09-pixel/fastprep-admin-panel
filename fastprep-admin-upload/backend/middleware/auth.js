const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Role } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const permissions = req.user.role.permissions;
    
    // Check if user has permission for this module and action
    if (permissions[module] && permissions[module][action]) {
      return next();
    }

    return res.status(403).json({ message: 'Insufficient permissions' });
  };
};

const checkDataAccess = (entityType) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const permissions = req.user.role.permissions;
    const dataAccess = permissions.dataAccess || {};
    
    // Check data visibility level
    if (dataAccess[entityType] === 'all') {
      return next();
    }
    
    if (dataAccess[entityType] === 'team') {
      // Add team-based filtering logic here
      req.dataFilter = { team: req.user.teamId };
      return next();
    }
    
    if (dataAccess[entityType] === 'own') {
      req.dataFilter = { userId: req.user.id };
      return next();
    }

    return res.status(403).json({ message: 'Insufficient data access' });
  };
};

const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role?.name
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });

  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

module.exports = {
  authenticateToken,
  checkPermission,
  checkDataAccess,
  generateTokens
};
