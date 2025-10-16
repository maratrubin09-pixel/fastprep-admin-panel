const { Conversation, Message, Customer, User } = require('../models');
const { Op } = require('sequelize');
const MessengerService = require('../services/MessengerService');

class MessageController {
  constructor() {
    this.messengerService = new MessengerService();
  }

  // Get all conversations across all platforms
  async getAllConversations(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        platform,
        status,
        assignedTo,
        search,
        sortBy = 'lastMessageAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Platform filter
      if (platform) {
        whereClause.platform = platform;
      }

      // Status filter
      if (status) {
        whereClause.status = status;
      }

      // Assigned to filter
      if (assignedTo) {
        whereClause.assignedTo = assignedTo;
      }

      // Search filter
      if (search) {
        whereClause[Op.or] = [
          { platformId: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: conversations } = await Conversation.findAndCountAll({
        where: whereClause,
        include: [
          { 
            model: Customer, 
            as: 'customer',
            where: search ? {
              [Op.or]: [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined,
            required: false
          },
          { 
            model: User, 
            as: 'assignedUser',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [
              { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }
            ]
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        conversations,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  }

  // Get conversation by ID
  async getConversationById(req, res) {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findByPk(id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'assignedUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: Message,
            as: 'messages',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      res.json({ conversation });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  }

  // Get messages for a conversation
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: messages } = await Message.findAndCountAll({
        where: { conversationId: id },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        messages,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  }

  // Send message
  async sendMessage(req, res) {
    try {
      const { conversationId, content, messageType = 'text', metadata = {} } = req.body;
      const senderId = req.user.id;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Create message record
      const message = await Message.create({
        conversationId,
        senderId,
        senderType: 'agent',
        content,
        messageType,
        metadata: {
          ...metadata,
          sentBy: req.user.firstName + ' ' + req.user.lastName
        }
      });

      // Send message via appropriate platform
      const messageData = {
        to: conversation.platformId,
        message: content,
        type: messageType,
        ...metadata
      };

      try {
        const platformResponse = await this.messengerService.sendMessage(
          conversation.platform,
          messageData
        );

        // Update message with platform response
        await message.update({
          platformMessageId: platformResponse.messageId || platformResponse.id,
          metadata: {
            ...message.metadata,
            platformResponse
          }
        });
      } catch (platformError) {
        console.error('Platform send error:', platformError);
        // Message is still saved in database even if platform send fails
      }

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessageFrom: 'agent',
        status: conversation.status === 'new' ? 'in_progress' : conversation.status
      });

      // Emit real-time update
      if (req.io) {
        req.io.to(`conversation_${conversationId}`).emit('new_message', {
          message: await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
          })
        });
      }

      res.status(201).json({
        message: 'Message sent successfully',
        data: await Message.findByPk(message.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
        })
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }

  // Assign conversation to user
  async assignConversation(req, res) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

      const conversation = await Conversation.findByPk(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      await conversation.update({ assignedTo });

      // Emit real-time update
      if (req.io) {
        req.io.to(`conversation_${id}`).emit('conversation_assigned', {
          conversationId: id,
          assignedTo
        });
      }

      res.json({
        message: 'Conversation assigned successfully',
        conversation: await Conversation.findByPk(id, {
          include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'firstName', 'lastName'] }
          ]
        })
      });
    } catch (error) {
      console.error('Assign conversation error:', error);
      res.status(500).json({ message: 'Failed to assign conversation' });
    }
  }

  // Update conversation status
  async updateConversationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, priority } = req.body;

      const conversation = await Conversation.findByPk(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      await conversation.update(updateData);

      // Emit real-time update
      if (req.io) {
        req.io.to(`conversation_${id}`).emit('conversation_updated', {
          conversationId: id,
          status,
          priority
        });
      }

      res.json({
        message: 'Conversation updated successfully',
        conversation
      });
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ message: 'Failed to update conversation' });
    }
  }

  // Mark conversation as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findByPk(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      await conversation.update({ unreadCount: 0 });

      await Message.update(
        { isRead: true, readAt: new Date() },
        { where: { conversationId: id, isRead: false } }
      );

      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ message: 'Failed to mark conversation as read' });
    }
  }

  // Get conversation statistics
  async getConversationStats(req, res) {
    try {
      const stats = await Conversation.findAll({
        attributes: [
          'platform',
          'status',
          [Conversation.sequelize.fn('COUNT', Conversation.sequelize.col('id')), 'count']
        ],
        group: ['platform', 'status'],
        raw: true
      });

      const totalUnread = await Conversation.sum('unreadCount');
      const totalConversations = await Conversation.count();

      res.json({
        stats,
        totalUnread,
        totalConversations
      });
    } catch (error) {
      console.error('Get conversation stats error:', error);
      res.status(500).json({ message: 'Failed to get conversation statistics' });
    }
  }

  // Get platform-specific conversations
  async getPlatformConversations(req, res) {
    try {
      const { platform } = req.params;
      const { page = 1, limit = 20, status, assignedTo } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { platform };

      if (status) whereClause.status = status;
      if (assignedTo) whereClause.assignedTo = assignedTo;

      const { count, rows: conversations } = await Conversation.findAndCountAll({
        where: whereClause,
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'assignedUser', attributes: ['id', 'firstName', 'lastName'] },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']]
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        conversations,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get platform conversations error:', error);
      res.status(500).json({ message: 'Failed to get platform conversations' });
    }
  }
}

module.exports = new MessageController();
