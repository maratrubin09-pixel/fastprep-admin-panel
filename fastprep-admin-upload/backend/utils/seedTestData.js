const { Customer, Lead, Task, Conversation, Message, User } = require('../models');

const seedTestData = async () => {
  try {
    console.log('Seeding test data...');

    // Get admin user
    const adminUser = await User.findOne({ where: { email: 'admin@fastprepusa.com' } });
    if (!adminUser) {
      console.log('Admin user not found, skipping test data seeding');
      return;
    }

    // Create test customers
    const customers = await Promise.all([
      Customer.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        position: 'CEO',
        source: 'website',
        status: 'qualified',
        assignedTo: adminUser.id
      }),
      Customer.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'Tech Solutions',
        position: 'CTO',
        source: 'referral',
        status: 'contacted',
        assignedTo: adminUser.id
      }),
      Customer.create({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        company: 'Startup Inc',
        position: 'Founder',
        source: 'social',
        status: 'new',
        assignedTo: adminUser.id
      })
    ]);

    // Create test leads
    const leads = await Promise.all([
      Lead.create({
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        phone: '+1234567893',
        company: 'Marketing Pro',
        message: 'Interested in your services',
        source: 'website',
        status: 'new',
        priority: 'high',
        assignedTo: adminUser.id
      }),
      Lead.create({
        firstName: 'Charlie',
        lastName: 'Wilson',
        email: 'charlie.wilson@example.com',
        phone: '+1234567894',
        company: 'Sales Corp',
        message: 'Looking for partnership opportunities',
        source: 'referral',
        status: 'contacted',
        priority: 'medium',
        assignedTo: adminUser.id
      })
    ]);

    // Create test tasks
    const tasks = await Promise.all([
      Task.create({
        title: 'Follow up with John Doe',
        description: 'Call John to discuss proposal',
        status: 'todo',
        priority: 'high',
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        customerId: customers[0].id
      }),
      Task.create({
        title: 'Prepare presentation for Jane',
        description: 'Create slides for product demo',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        customerId: customers[1].id
      }),
      Task.create({
        title: 'Research competitor pricing',
        description: 'Analyze market rates for similar services',
        status: 'done',
        priority: 'low',
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        completedAt: new Date(),
        customerId: customers[2].id
      })
    ]);

    // Create test conversations
    const conversations = await Promise.all([
      Conversation.create({
        platform: 'whatsapp',
        platformId: 'whatsapp_123',
        customerId: customers[0].id,
        assignedTo: adminUser.id,
        status: 'in_progress',
        priority: 'high',
        lastMessageAt: new Date(),
        lastMessageFrom: 'customer',
        unreadCount: 2
      }),
      Conversation.create({
        platform: 'email',
        platformId: 'email_456',
        customerId: customers[1].id,
        assignedTo: adminUser.id,
        status: 'new',
        priority: 'medium',
        lastMessageAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        lastMessageFrom: 'agent',
        unreadCount: 0
      })
    ]);

    // Create test messages
    await Promise.all([
      Message.create({
        conversationId: conversations[0].id,
        senderType: 'customer',
        content: 'Hello, I am interested in your services',
        messageType: 'text',
        isRead: false
      }),
      Message.create({
        conversationId: conversations[0].id,
        senderType: 'agent',
        senderId: adminUser.id,
        content: 'Thank you for your interest! How can I help you?',
        messageType: 'text',
        isRead: true
      }),
      Message.create({
        conversationId: conversations[1].id,
        senderType: 'customer',
        content: 'Can you send me more information about pricing?',
        messageType: 'text',
        isRead: true
      })
    ]);

    console.log('Test data seeded successfully!');
    console.log(`Created: ${customers.length} customers, ${leads.length} leads, ${tasks.length} tasks, ${conversations.length} conversations`);

  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};

module.exports = { seedTestData };
