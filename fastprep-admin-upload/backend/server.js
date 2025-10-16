const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const config = require('./config/config');
const { sequelize } = require('./models');
const { seedDatabase } = require('./utils/seed');
const SocketHandlers = require('./socket/SocketHandlers');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Initialize Socket.io handlers
const socketHandlers = new SocketHandlers(io);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io and socketHandlers accessible to routes
app.use((req, res, next) => {
  req.io = io;
  req.socketHandlers = socketHandlers;
  next();
});

// API Info route
app.get('/api', (req, res) => {
  res.json({
    name: 'Fast Prep USA Admin Panel API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      customers: '/api/customers',
      leads: '/api/leads',
      messages: '/api/messages',
      tasks: '/api/tasks',
      webhooks: '/api/webhooks',
      files: '/api/files',
      analytics: '/api/analytics',
      messengers: '/api/messengers'
    },
    documentation: 'https://github.com/your-repo/fastprep-admin-panel',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/files', require('./routes/files'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/messengers', require('./routes/messengers'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized.');
      
      // Seed database with initial data
      try {
        await seedDatabase();
      } catch (seedError) {
        console.log('Database already seeded or seeding failed:', seedError.message);
      }
    }
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
