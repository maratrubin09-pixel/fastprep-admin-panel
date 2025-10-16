const express = require('express');
const router = express.Router();
const MessengerService = require('../services/MessengerService');
const WhatsAppService = require('../services/WhatsAppService');
const TelegramService = require('../services/TelegramService');
const FacebookService = require('../services/FacebookService');
const InstagramService = require('../services/InstagramService');
const EmailService = require('../services/EmailService');
const config = require('../config/config');

const messengerService = new MessengerService();

// WhatsApp webhook
router.post('/whatsapp', async (req, res) => {
  try {
    const result = await messengerService.receiveMessage('whatsapp', req.body);
    res.json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Telegram webhook
router.post('/telegram', async (req, res) => {
  try {
    const result = await messengerService.receiveMessage('telegram', req.body);
    res.json(result);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Facebook Messenger webhook
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.FACEBOOK_APP_SECRET) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Invalid verification token' });
  }
});

router.post('/facebook', async (req, res) => {
  try {
    const result = await messengerService.receiveMessage('facebook', req.body);
    res.json(result);
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Instagram webhook
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.FACEBOOK_APP_SECRET) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Invalid verification token' });
  }
});

router.post('/instagram', async (req, res) => {
  try {
    const result = await messengerService.receiveMessage('instagram', req.body);
    res.json(result);
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Email webhook (for services like SendGrid, Mailgun, etc.)
router.post('/email', async (req, res) => {
  try {
    const result = await messengerService.receiveMessage('email', req.body);
    res.json(result);
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// WordPress form webhook
router.post('/wordpress', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, message, source = 'website' } = req.body;
    
    // Verify webhook secret if provided
    const webhookSecret = req.headers['x-webhook-secret'];
    if (config.WORDPRESS_WEBHOOK_SECRET && webhookSecret !== config.WORDPRESS_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    // Create lead from WordPress form submission
    const { Lead } = require('../models');
    
    const lead = await Lead.create({
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      source,
      sourceDetails: 'WordPress Contact Form',
      status: 'new',
      priority: 'medium'
    });

    // TODO: Send notification to assigned user
    // TODO: Create task for follow-up

    res.json({
      message: 'Lead created successfully',
      leadId: lead.id
    });
  } catch (error) {
    console.error('WordPress webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webhooks: {
      whatsapp: !!config.WHATSAPP_TOKEN,
      telegram: !!config.TELEGRAM_BOT_TOKEN,
      facebook: !!config.FACEBOOK_ACCESS_TOKEN,
      instagram: !!config.INSTAGRAM_ACCESS_TOKEN,
      email: !!(config.SMTP_HOST && config.SMTP_USER)
    }
  });
});

module.exports = router;
