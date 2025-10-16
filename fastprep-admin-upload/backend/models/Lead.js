const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'website',
    validate: {
      isIn: [['website', 'referral', 'social', 'advertisement', 'cold_call', 'other']]
    }
  },
  sourceDetails: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
    defaultValue: 'new'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  convertedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  }
}, {
  tableName: 'leads',
  timestamps: true
});

module.exports = Lead;
