const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  leadId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Leads',
      key: 'id'
    }
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  estimatedHours: {
    type: DataTypes.REAL(5, 2),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.REAL(5, 2),
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true
});

module.exports = Task;
