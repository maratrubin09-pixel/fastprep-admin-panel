const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('../config/config');
const { Conversation, Message, Customer } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
    this.imap = null;
    this.initializeTransporter();
    this.initializeImap();
  }

  initializeTransporter() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
    }
  }

  initializeImap() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.imap = new Imap({
        user: config.SMTP_USER,
        password: config.SMTP_PASS,
        host: config.SMTP_HOST,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
    }
  }

  async sendMessage(messageData) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }

      const { to, subject, message, type = 'text', attachments = [] } = messageData;
      
      let mailOptions = {
        from: config.FROM_EMAIL,
        to: to,
        subject: subject,
        html: type === 'html' ? message : `<p>${message}</p>`,
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async processIncomingEmail(emailData) {
    try {
      const { from, to, subject, text, html, messageId, date } = emailData;
      
      // Extract email address from "Name <email@domain.com>" format
      const emailAddress = this.extractEmailAddress(from);
      
      // Find or create customer
      let customer = await Customer.findOne({
        where: { 
          email: emailAddress,
          source: 'email'
        }
      });
      
      if (!customer) {
        const name = this.extractName(from);
        
        customer = await Customer.create({
          firstName: name.firstName || 'Email',
          lastName: name.lastName || 'User',
          email: emailAddress,
          source: 'email',
          status: 'new'
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: {
          platform: 'email',
          platformId: emailAddress
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          platform: 'email',
          platformId: emailAddress,
          customerId: customer.id,
          status: 'new',
          metadata: {
            emailAddress: emailAddress,
            originalFrom: from
          }
        });
      }

      // Create message record
      await Message.create({
        conversationId: conversation.id,
        senderType: 'customer',
        content: html || text,
        messageType: html ? 'html' : 'text',
        platformMessageId: messageId,
        metadata: {
          emailMessageId: messageId,
          from: from,
          to: to,
          subject: subject,
          date: date
        }
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(date),
        lastMessageFrom: 'customer',
        unreadCount: conversation.unreadCount + 1,
        status: conversation.status === 'new' ? 'in_progress' : conversation.status
      });

      return { conversationId: conversation.id, messageId: messageId };
    } catch (error) {
      console.error('Error processing incoming email:', error);
      throw error;
    }
  }

  async fetchEmails() {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not configured'));
        return;
      }

      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (results.length === 0) {
              resolve([]);
              return;
            }

            const fetch = this.imap.fetch(results, { bodies: '' });
            const emails = [];

            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              
              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                
                stream.once('end', () => {
                  simpleParser(buffer, (err, parsed) => {
                    if (!err) {
                      emails.push({
                        from: parsed.from.text,
                        to: parsed.to.text,
                        subject: parsed.subject,
                        text: parsed.text,
                        html: parsed.html,
                        messageId: parsed.messageId,
                        date: parsed.date
                      });
                    }
                  });
                });
              });
            });

            fetch.once('error', reject);
            fetch.once('end', () => {
              this.imap.end();
              resolve(emails);
            });
          });
        });
      });

      this.imap.once('error', reject);
      this.imap.once('end', () => {
        console.log('Connection ended');
      });

      this.imap.connect();
    });
  }

  async processWebhook(webhookData) {
    try {
      // This would typically be called by an email webhook service
      // For now, we'll process the email data directly
      await this.processIncomingEmail(webhookData);
      
      return { status: 'processed' };
    } catch (error) {
      console.error('Email webhook processing error:', error);
      throw error;
    }
  }

  extractEmailAddress(from) {
    const match = from.match(/<(.+)>/);
    return match ? match[1] : from;
  }

  extractName(from) {
    const match = from.match(/^(.+)\s*<(.+)>$/);
    if (match) {
      const fullName = match[1].trim();
      const nameParts = fullName.split(' ');
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
    }
    return { firstName: '', lastName: '' };
  }

  async getConversations(filters = {}) {
    const conversations = await Conversation.findAll({
      where: { platform: 'email' },
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

  async createTemplate(templateData) {
    // Email template management
    return {
      id: Date.now().toString(),
      name: templateData.name,
      subject: templateData.subject,
      body: templateData.body,
      variables: templateData.variables || []
    };
  }

  async sendTemplate(templateId, to, variables = {}) {
    // Send email using template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let subject = template.subject;
    let body = template.body;

    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return await this.sendMessage({
      to,
      subject,
      message: body,
      type: 'html'
    });
  }

  async getTemplate(templateId) {
    // This would typically fetch from database
    // For now, return a mock template
    return {
      id: templateId,
      name: 'Welcome Email',
      subject: 'Welcome to Fast Prep USA',
      body: '<h1>Welcome!</h1><p>Thank you for contacting us.</p>',
      variables: ['name', 'company']
    };
  }
}

module.exports = EmailService;
