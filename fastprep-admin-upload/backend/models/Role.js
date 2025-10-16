const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'roles',
  timestamps: true
});

module.exports = Role;
