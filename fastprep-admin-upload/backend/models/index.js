const sequelize = require('./sequelize');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Customer = require('./Customer');
const Lead = require('./Lead');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Task = require('./Task');
const ActivityLog = require('./ActivityLog');
const File = require('./File');

// Set up associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

Customer.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
User.hasMany(Customer, { foreignKey: 'assignedTo', as: 'assignedCustomers' });

Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
User.hasMany(Lead, { foreignKey: 'assignedTo', as: 'assignedLeads' });

Lead.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Lead, { foreignKey: 'customerId', as: 'convertedLeads' });

Conversation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Conversation, { foreignKey: 'customerId', as: 'conversations' });

Conversation.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
User.hasMany(Conversation, { foreignKey: 'assignedTo', as: 'assignedConversations' });

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });

Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });

Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });

Task.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Task, { foreignKey: 'customerId', as: 'customerTasks' });

Task.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Lead.hasMany(Task, { foreignKey: 'leadId', as: 'leadTasks' });

ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });

File.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(File, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });

module.exports = { 
  sequelize,
  User,
  Role,
  Customer,
  Lead,
  Conversation,
  Message,
  Task,
  ActivityLog,
  File
};
