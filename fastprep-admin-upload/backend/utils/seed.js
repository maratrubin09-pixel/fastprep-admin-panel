const { Role, User } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create default roles
    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Full system access',
      permissions: JSON.stringify({
        crm: { create: true, read: true, update: true, delete: true },
        tasks: { create: true, read: true, update: true, delete: true },
        messages: { create: true, read: true, update: true, delete: true },
        analytics: { create: true, read: true, update: true, delete: true },
        users: { create: true, read: true, update: true, delete: true },
        roles: { create: true, read: true, update: true, delete: true },
        settings: { create: true, read: true, update: true, delete: true },
        dataAccess: {
          customers: 'all',
          leads: 'all',
          tasks: 'all',
          messages: 'all'
        }
      }),
      isActive: true
    });

    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Management access with team oversight',
      permissions: JSON.stringify({
        crm: { create: true, read: true, update: true, delete: false },
        tasks: { create: true, read: true, update: true, delete: true },
        messages: { create: true, read: true, update: true, delete: false },
        analytics: { create: false, read: true, update: false, delete: false },
        users: { create: false, read: true, update: true, delete: false },
        roles: { create: false, read: true, update: false, delete: false },
        settings: { create: false, read: true, update: false, delete: false },
        dataAccess: {
          customers: 'team',
          leads: 'team',
          tasks: 'team',
          messages: 'team'
        }
      }),
      isActive: true
    });

    const agentRole = await Role.create({
      name: 'Agent',
      description: 'Basic agent access',
      permissions: JSON.stringify({
        crm: { create: true, read: true, update: true, delete: false },
        tasks: { create: true, read: true, update: true, delete: false },
        messages: { create: true, read: true, update: true, delete: false },
        analytics: { create: false, read: false, update: false, delete: false },
        users: { create: false, read: false, update: false, delete: false },
        roles: { create: false, read: false, update: false, delete: false },
        settings: { create: false, read: false, update: false, delete: false },
        dataAccess: {
          customers: 'own',
          leads: 'own',
          tasks: 'own',
          messages: 'own'
        }
      }),
      isActive: true
    });

    // Create default admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@fastprepusa.com',
      password: 'admin123',
      phone: '+1234567890',
      roleId: adminRole.id,
      isActive: true
    });

    console.log('Database seeded successfully!');
    console.log('Default admin user created:');
    console.log('Email: admin@fastprepusa.com');
    console.log('Password: admin123');
    console.log('Roles created: Admin, Manager, Agent');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedDatabase };
