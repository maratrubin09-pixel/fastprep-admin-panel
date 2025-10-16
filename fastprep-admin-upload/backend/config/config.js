module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Messenger API Keys
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
  
  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@fastprepusa.com',
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // WordPress Integration
  WORDPRESS_WEBHOOK_SECRET: process.env.WORDPRESS_WEBHOOK_SECRET || 'your-webhook-secret',
};
