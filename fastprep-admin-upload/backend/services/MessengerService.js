const axios = require('axios');
const config = require('../config/config');
const WhatsAppService = require('./WhatsAppService');
const TelegramService = require('./TelegramService');
const FacebookService = require('./FacebookService');
const InstagramService = require('./InstagramService');
const EmailService = require('./EmailService');

class MessengerService {
  constructor() {
    this.services = {
      whatsapp: new WhatsAppService(),
      telegram: new TelegramService(),
      facebook: new FacebookService(),
      instagram: new InstagramService(),
      email: new EmailService()
    };
  }

  async sendMessage(platform, messageData) {
    try {
      const service = this.services[platform];
      if (!service) {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      return await service.sendMessage(messageData);
    } catch (error) {
      console.error(`Error sending message via ${platform}:`, error);
      throw error;
    }
  }

  async receiveMessage(platform, webhookData) {
    try {
      const service = this.services[platform];
      if (!service) {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      return await service.processWebhook(webhookData);
    } catch (error) {
      console.error(`Error processing webhook from ${platform}:`, error);
      throw error;
    }
  }

  async getConversations(platform, filters = {}) {
    try {
      const service = this.services[platform];
      if (!service) {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      return await service.getConversations(filters);
    } catch (error) {
      console.error(`Error getting conversations from ${platform}:`, error);
      throw error;
    }
  }

  async getMessages(platform, conversationId, filters = {}) {
    try {
      const service = this.services[platform];
      if (!service) {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      return await service.getMessages(conversationId, filters);
    } catch (error) {
      console.error(`Error getting messages from ${platform}:`, error);
      throw error;
    }
  }
}

module.exports = MessengerService;
