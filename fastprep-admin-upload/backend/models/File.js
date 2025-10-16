const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: '{}'
  }
}, {
  tableName: 'files',
  timestamps: true
});

module.exports = File;
