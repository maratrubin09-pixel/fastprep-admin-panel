const { User, Role, ActivityLog } = require('../models');
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      roleId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (roleId) {
      whereClause.roleId = roleId;
    }

    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [{ model: Role, as: 'role' }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

const createUser = async (req, res) => {
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

    res.status(201).json({
      message: 'User created successfully',
      user: userWithRole.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, roleId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }
    }

    // Check if role exists
    if (roleId && roleId !== user.roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' });
      }
    }

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      phone: phone || user.phone,
      roleId: roleId || user.roleId,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: activities } = await ActivityLog.findAndCountAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      activities,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Failed to get user activity' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserActivity
};
