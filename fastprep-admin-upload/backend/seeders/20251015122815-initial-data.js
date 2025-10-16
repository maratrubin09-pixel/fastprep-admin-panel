'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create default roles
    const roles = await queryInterface.bulkInsert('roles', [
      {
        id: Sequelize.UUIDV4(),
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.UUIDV4(),
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.UUIDV4(),
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Get the admin role ID
    const adminRole = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE name = \'Admin\' LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (adminRole.length > 0) {
      const adminRoleId = adminRole[0].id;
      const hashedPassword = await bcrypt.hash('admin123', 12);

      // Create default admin user
      await queryInterface.bulkInsert('users', [
        {
          id: Sequelize.UUIDV4(),
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@fastprepusa.com',
          password: hashedPassword,
          phone: '+1234567890',
          avatar: null,
          isActive: true,
          lastLogin: null,
          roleId: adminRoleId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
