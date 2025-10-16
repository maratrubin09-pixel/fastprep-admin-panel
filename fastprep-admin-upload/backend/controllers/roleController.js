const { Role, User } = require('../models');
const { Op } = require('sequelize');

const getAllRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: roles } = await Role.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      roles,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Failed to get roles' });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email', 'isActive']
      }]
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Failed to get role' });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions, isActive = true } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    // Validate permissions structure
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Valid permissions object is required' });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      isActive
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ message: 'Role name already taken' });
      }
    }

    // Validate permissions structure
    if (permissions && typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Valid permissions object is required' });
    }

    await role.update({
      name: name || role.name,
      description: description !== undefined ? description : role.description,
      permissions: permissions || role.permissions,
      isActive: isActive !== undefined ? isActive : role.isActive
    });

    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{ model: User, as: 'users' }]
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if role has users
    if (role.users && role.users.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role with assigned users',
        usersCount: role.users.length
      });
    }

    await role.destroy();

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Failed to delete role' });
  }
};

const getDefaultPermissions = async (req, res) => {
  try {
    const defaultPermissions = {
      crm: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      tasks: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      messages: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      analytics: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      users: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      roles: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      settings: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      dataAccess: {
        customers: 'own', // own, team, all
        leads: 'own',
        tasks: 'own',
        messages: 'own'
      }
    };

    res.json({ permissions: defaultPermissions });
  } catch (error) {
    console.error('Get default permissions error:', error);
    res.status(500).json({ message: 'Failed to get default permissions' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getDefaultPermissions
};
