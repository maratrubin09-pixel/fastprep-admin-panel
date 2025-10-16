const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Conversations',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  senderType: {
    type: DataTypes.ENUM('customer', 'agent', 'system'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'location'),
    defaultValue: 'text'
  },
  platformMessageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: '{}'
  }
}, {
  tableName: 'messages',
  timestamps: true
});

module.exports = Message;
