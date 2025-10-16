const axios = require('axios');
const config = require('../config/config');
const { Conversation, Message, Customer } = require('../models');

class InstagramService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.INSTAGRAM_ACCESS_TOKEN;
  }

  async sendMessage(messageData) {
    try {
      const { to, message, type = 'text' } = messageData;
      
      let payload;
      
      switch (type) {
        case 'text':
          payload = {
            recipient: { id: to },
            message: { text: message }
          };
          break;
          
        case 'media':
          payload = {
            recipient: { id: to },
            message: {
              attachment: {
                type: messageData.mediaType || 'image',
                payload: {
                  url: messageData.mediaUrl
                }
              }
            }
          };
          break;
          
        case 'template':
          payload = {
            recipient: { id: to },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: messageData.templateType || 'generic',
                  elements: messageData.elements || []
                }
              }
            }
          };
          break;
          
        default:
          throw new Error(`Unsupported message type: ${type}`);
      }

      const response = await axios.post(
        `${this.apiUrl}/me/messages`,
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
      console.error('Instagram send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  async processWebhook(webhookData) {
    try {
      const entries = webhookData.entry || [];
      
      for (const entry of entries) {
        const messaging = entry.messaging || [];
        
        for (const event of messaging) {
          if (event.message) {
            await this.processIncomingMessage(event);
          } else if (event.postback) {
            await this.processPostback(event);
          } else if (event.delivery) {
            await this.processDelivery(event);
          } else if (event.read) {
            await this.processRead(event);
          }
        }
      }
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Instagram webhook processing error:', error);
      throw error;
    }
  }

  async processIncomingMessage(event) {
    try {
      const senderId = event.sender.id;
      const message = event.message;
      const timestamp = event.timestamp;
      
      // Find or create customer
      let customer = await Customer.findOne({
        where: { 
          phone: senderId,
          source: 'instagram'
        }
      });
      
      if (!customer) {
        // Get user profile from Instagram
        const userProfile = await this.getUserProfile(senderId);
        
        customer = await Customer.create({
          firstName: userProfile.first_name || 'Instagram',
          lastName: userProfile.last_name || 'User',
          phone: senderId,
          source: 'instagram',
          status: 'new',
          notes: `Instagram ID: ${senderId}`
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: {
          platform: 'instagram',
          platformId: senderId
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          platform: 'instagram',
          platformId: senderId,
          customerId: customer.id,
          status: 'new',
          metadata: {
            senderId: senderId,
            pageId: event.recipient.id
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
        platformMessageId: message.mid,
        metadata: {
          instagramMessageId: message.mid,
          timestamp: timestamp,
          message: message
        }
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(timestamp),
        lastMessageFrom: 'customer',
        unreadCount: conversation.unreadCount + 1,
        status: conversation.status === 'new' ? 'in_progress' : conversation.status
      });

      return { conversationId: conversation.id, messageId: message.mid };
    } catch (error) {
      console.error('Error processing incoming Instagram message:', error);
      throw error;
    }
  }

  async processPostback(event) {
    try {
      const senderId = event.sender.id;
      const postback = event.postback;
      
      console.log('Instagram postback:', { senderId, postback });
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Error processing Instagram postback:', error);
      throw error;
    }
  }

  async processDelivery(event) {
    try {
      const senderId = event.sender.id;
      const delivery = event.delivery;
      
      console.log('Instagram delivery:', { senderId, delivery });
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Error processing Instagram delivery:', error);
      throw error;
    }
  }

  async processRead(event) {
    try {
      const senderId = event.sender.id;
      const read = event.read;
      
      console.log('Instagram read:', { senderId, read });
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Error processing Instagram read:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: {
            fields: 'first_name,last_name,profile_pic'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting Instagram user profile:', error);
      return { first_name: 'Instagram', last_name: 'User' };
    }
  }

  extractMessageContent(message) {
    if (message.text) {
      return message.text;
    } else if (message.attachments) {
      const attachment = message.attachments[0];
      if (attachment.type === 'image') {
        return '[Image]';
      } else if (attachment.type === 'video') {
        return '[Video]';
      } else if (attachment.type === 'audio') {
        return '[Audio]';
      } else if (attachment.type === 'file') {
        return '[File]';
      } else if (attachment.type === 'location') {
        return '[Location]';
      } else {
        return '[Attachment]';
      }
    } else if (message.quick_reply) {
      return `[Quick Reply: ${message.quick_reply.payload}]`;
    } else {
      return '[Unsupported message type]';
    }
  }

  getMessageType(message) {
    if (message.text) return 'text';
    if (message.attachments) {
      const attachment = message.attachments[0];
      if (attachment.type === 'image') return 'image';
      if (attachment.type === 'video') return 'video';
      if (attachment.type === 'audio') return 'audio';
      if (attachment.type === 'file') return 'file';
      if (attachment.type === 'location') return 'location';
    }
    return 'text';
  }

  async getConversations(filters = {}) {
    const conversations = await Conversation.findAll({
      where: { platform: 'instagram' },
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
      
      await Message.update(
        { isRead: true, readAt: new Date() },
        { where: { conversationId, isRead: false } }
      );
    }
  }
}

module.exports = InstagramService;
