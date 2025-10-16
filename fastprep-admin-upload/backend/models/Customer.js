const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Customer = sequelize.define('Customer', {
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
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'USA'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['website', 'referral', 'social', 'advertisement', 'cold_call', 'other']]
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'),
    defaultValue: 'new'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lastContactDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextFollowUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true
});

module.exports = Customer;
