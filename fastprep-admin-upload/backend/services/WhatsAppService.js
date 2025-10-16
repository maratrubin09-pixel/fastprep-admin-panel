const axios = require('axios');
const config = require('../config/config');
const { Conversation, Message, Customer } = require('../models');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.WHATSAPP_TOKEN;
    this.phoneNumberId = config.WHATSAPP_PHONE_NUMBER_ID;
  }

  async sendMessage(messageData) {
    try {
      const { to, message, type = 'text' } = messageData;
      
      let payload;
      
      switch (type) {
        case 'text':
          payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message }
          };
          break;
          
        case 'template':
          payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
              name: messageData.templateName,
              language: { code: messageData.language || 'en' },
              components: messageData.components || []
            }
          };
          break;
          
        case 'media':
          payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'image',
            image: {
              link: messageData.mediaUrl,
              caption: messageData.caption || ''
            }
          };
          break;
          
        default:
          throw new Error(`Unsupported message type: ${type}`);
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('WhatsApp send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  async processWebhook(webhookData) {
    try {
      const entries = webhookData.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            
            for (const message of messages) {
              await this.processIncomingMessage(message, change.value);
            }
          }
        }
      }
      
      return { status: 'processed' };
    } catch (error) {
      console.error('WhatsApp webhook processing error:', error);
      throw error;
    }
  }

  async processIncomingMessage(message, context) {
    try {
      const phoneNumber = message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;
      
      // Find or create customer
      let customer = await Customer.findOne({
        where: { phone: phoneNumber }
      });
      
      if (!customer) {
        customer = await Customer.create({
          firstName: 'WhatsApp',
          lastName: 'User',
          phone: phoneNumber,
          source: 'whatsapp',
          status: 'new'
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: {
          platform: 'whatsapp',
          platformId: phoneNumber
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          platform: 'whatsapp',
          platformId: phoneNumber,
          customerId: customer.id,
          status: 'new',
          metadata: {
            phoneNumber: phoneNumber,
            profileName: context.profile?.name || null
          }
        });
      }

      // Create message record
      const messageContent = this.extractMessageContent(message);
      
      await Message.create({
        conversationId: conversation.id,
        senderType: 'customer',
        content: messageContent,
        messageType: this.getMessageType(message),
        platformMessageId: messageId,
        metadata: {
          whatsappMessageId: messageId,
          timestamp: timestamp,
          context: context
        }
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(timestamp * 1000),
        lastMessageFrom: 'customer',
        unreadCount: conversation.unreadCount + 1,
        status: conversation.status === 'new' ? 'in_progress' : conversation.status
      });

      return { conversationId: conversation.id, messageId: messageId };
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error);
      throw error;
    }
  }

  extractMessageContent(message) {
    if (message.text) {
      return message.text.body;
    } else if (message.image) {
      return `[Image: ${message.image.caption || 'No caption'}]`;
    } else if (message.audio) {
      return '[Audio message]';
    } else if (message.video) {
      return '[Video message]';
    } else if (message.document) {
      return `[Document: ${message.document.filename || 'Unknown file'}]`;
    } else if (message.location) {
      return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
    } else if (message.contacts) {
      return '[Contact information]';
    } else {
      return '[Unsupported message type]';
    }
  }

  getMessageType(message) {
    if (message.text) return 'text';
    if (message.image) return 'image';
    if (message.audio) return 'audio';
    if (message.video) return 'video';
    if (message.document) return 'file';
    if (message.location) return 'location';
    return 'text';
  }

  async getConversations(filters = {}) {
    // This would typically fetch from your database
    // For now, return conversations from database
    const conversations = await Conversation.findAll({
      where: { platform: 'whatsapp' },
      include: [
        { model: Customer, as: 'customer' },
        { model: Message, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    return conversations;
  }

  async getMessages(conversationId, filters = {}) {
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return messages;
  }

  async markAsRead(conversationId) {
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      await conversation.update({
        unreadCount: 0
      });
      
      // Mark all messages as read
      await Message.update(
        { isRead: true, readAt: new Date() },
        { where: { conversationId, isRead: false } }
      );
    }
  }

  async getTemplates() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.phoneNumberId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      return [];
    }
  }
}

module.exports = WhatsAppService;
