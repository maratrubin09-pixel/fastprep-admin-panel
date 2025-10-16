const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  platform: {
    type: DataTypes.ENUM('whatsapp', 'telegram', 'facebook', 'instagram', 'email'),
    allowNull: false
  },
  platformId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'new'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastMessageFrom: {
    type: DataTypes.ENUM('customer', 'agent'),
    allowNull: true
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: '{}'
  }
}, {
  tableName: 'conversations',
  timestamps: true
});

module.exports = Conversation;
