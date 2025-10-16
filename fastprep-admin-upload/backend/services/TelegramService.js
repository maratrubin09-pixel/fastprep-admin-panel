const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const { Conversation, Message, Customer } = require('../models');

class TelegramService {
  constructor() {
    this.botToken = config.TELEGRAM_BOT_TOKEN;
    this.bot = null;
    this.webhookUrl = null;
  }

  async initialize() {
    if (this.botToken) {
      this.bot = new TelegramBot(this.botToken, { polling: false });
      await this.setupWebhook();
    }
  }

  async setupWebhook() {
    try {
      const webhookUrl = `${config.FRONTEND_URL.replace('3000', '5000')}/api/webhooks/telegram`;
      await this.bot.setWebHook(webhookUrl);
      this.webhookUrl = webhookUrl;
      console.log('Telegram webhook set up:', webhookUrl);
    } catch (error) {
      console.error('Error setting up Telegram webhook:', error);
    }
  }

  async sendMessage(messageData) {
    try {
      const { to, message, type = 'text', options = {} } = messageData;
      
      let result;
      
      switch (type) {
        case 'text':
          result = await this.bot.sendMessage(to, message, {
            parse_mode: 'HTML',
            ...options
          });
          break;
          
        case 'photo':
          result = await this.bot.sendPhoto(to, messageData.photoUrl, {
            caption: messageData.caption || '',
            ...options
          });
          break;
          
        case 'document':
          result = await this.bot.sendDocument(to, messageData.documentUrl, {
            caption: messageData.caption || '',
            ...options
          });
          break;
          
        case 'location':
          result = await this.bot.sendLocation(to, messageData.latitude, messageData.longitude, options);
          break;
          
        default:
          throw new Error(`Unsupported message type: ${type}`);
      }

      return result;
    } catch (error) {
      console.error('Telegram send message error:', error);
      throw error;
    }
  }

  async processWebhook(webhookData) {
    try {
      const update = webhookData;
      
      if (update.message) {
        await this.processIncomingMessage(update.message);
      } else if (update.callback_query) {
        await this.processCallbackQuery(update.callback_query);
      }
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Telegram webhook processing error:', error);
      throw error;
    }
  }

  async processIncomingMessage(message) {
    try {
      const chatId = message.chat.id;
      const messageId = message.message_id;
      const userId = message.from.id;
      const username = message.from.username;
      const firstName = message.from.first_name;
      const lastName = message.from.last_name;
      
      // Find or create customer
      let customer = await Customer.findOne({
        where: { 
          phone: userId.toString(),
          source: 'telegram'
        }
      });
      
      if (!customer) {
        customer = await Customer.create({
          firstName: firstName || 'Telegram',
          lastName: lastName || 'User',
          phone: userId.toString(),
          source: 'telegram',
          status: 'new',
          notes: `Username: @${username || 'N/A'}`
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: {
          platform: 'telegram',
          platformId: chatId.toString()
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          platform: 'telegram',
          platformId: chatId.toString(),
          customerId: customer.id,
          status: 'new',
          metadata: {
            chatId: chatId,
            userId: userId,
            username: username,
            chatType: message.chat.type
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
        platformMessageId: messageId.toString(),
        metadata: {
          telegramMessageId: messageId,
          chatId: chatId,
          userId: userId,
          message: message
        }
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(message.date * 1000),
        lastMessageFrom: 'customer',
        unreadCount: conversation.unreadCount + 1,
        status: conversation.status === 'new' ? 'in_progress' : conversation.status
      });

      return { conversationId: conversation.id, messageId: messageId };
    } catch (error) {
      console.error('Error processing incoming Telegram message:', error);
      throw error;
    }
  }

  async processCallbackQuery(callbackQuery) {
    try {
      // Handle callback queries (button presses, etc.)
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;
      
      // You can implement custom logic for callback queries here
      console.log('Telegram callback query:', { chatId, messageId, data });
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Error processing Telegram callback query:', error);
      throw error;
    }
  }

  extractMessageContent(message) {
    if (message.text) {
      return message.text;
    } else if (message.photo) {
      return '[Photo]';
    } else if (message.audio) {
      return '[Audio]';
    } else if (message.video) {
      return '[Video]';
    } else if (message.document) {
      return `[Document: ${message.document.file_name || 'Unknown file'}]`;
    } else if (message.location) {
      return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
    } else if (message.contact) {
      return '[Contact information]';
    } else if (message.sticker) {
      return '[Sticker]';
    } else if (message.voice) {
      return '[Voice message]';
    } else {
      return '[Unsupported message type]';
    }
  }

  getMessageType(message) {
    if (message.text) return 'text';
    if (message.photo) return 'image';
    if (message.audio) return 'audio';
    if (message.video) return 'video';
    if (message.document) return 'file';
    if (message.location) return 'location';
    if (message.voice) return 'audio';
    return 'text';
  }

  async getConversations(filters = {}) {
    const conversations = await Conversation.findAll({
      where: { platform: 'telegram' },
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

  async getBotInfo() {
    try {
      const botInfo = await this.bot.getMe();
      return botInfo;
    } catch (error) {
      console.error('Error getting Telegram bot info:', error);
      return null;
    }
  }

  async setCommands(commands) {
    try {
      await this.bot.setMyCommands(commands);
    } catch (error) {
      console.error('Error setting Telegram commands:', error);
    }
  }
}

module.exports = TelegramService;
