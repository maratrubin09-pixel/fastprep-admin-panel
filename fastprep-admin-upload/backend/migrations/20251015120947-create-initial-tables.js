'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      roleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create customers table
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company: {
        type: Sequelize.STRING,
        allowNull: true
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'USA'
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'),
        defaultValue: 'new'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      lastContactDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextFollowUpDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create leads table
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company: {
        type: Sequelize.STRING,
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'website'
      },
      sourceDetails: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      convertedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create conversations table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      platform: {
        type: Sequelize.ENUM('whatsapp', 'telegram', 'facebook', 'instagram', 'email'),
        allowNull: false
      },
      platformId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastMessageFrom: {
        type: Sequelize.ENUM('customer', 'agent'),
        allowNull: true
      },
      unreadCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        }
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      senderType: {
        type: Sequelize.ENUM('customer', 'agent', 'system'),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      messageType: {
        type: Sequelize.ENUM('text', 'image', 'file', 'audio', 'video', 'location'),
        defaultValue: 'text'
      },
      platformMessageId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create tasks table
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('todo', 'in_progress', 'review', 'done'),
        defaultValue: 'todo'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      leadId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'leads',
          key: 'id'
        }
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      estimatedHours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      actualHours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create activity_logs table
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create files table
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      originalName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      uploadedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['roleId']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['assignedTo']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('leads', ['email']);
    await queryInterface.addIndex('leads', ['assignedTo']);
    await queryInterface.addIndex('leads', ['status']);
    await queryInterface.addIndex('conversations', ['platform', 'platformId']);
    await queryInterface.addIndex('conversations', ['customerId']);
    await queryInterface.addIndex('conversations', ['assignedTo']);
    await queryInterface.addIndex('messages', ['conversationId']);
    await queryInterface.addIndex('messages', ['senderId']);
    await queryInterface.addIndex('tasks', ['assignedTo']);
    await queryInterface.addIndex('tasks', ['createdBy']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('activity_logs', ['userId']);
    await queryInterface.addIndex('activity_logs', ['entityType', 'entityId']);
    await queryInterface.addIndex('files', ['uploadedBy']);
    await queryInterface.addIndex('files', ['entityType', 'entityId']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('files');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversations');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
  }
};
