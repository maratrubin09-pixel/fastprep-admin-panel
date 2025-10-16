#!/bin/bash

# Fast Prep USA Admin Panel - Production Environment Setup
# This script configures the production environment

set -e

echo "🔧 Setting up Fast Prep USA Admin Panel Production Environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create production environment files
print_status "Creating production environment files..."

# Backend .env for production
cat > backend/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database Configuration (Update with your actual values)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=fastprep_admin_prod
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration (Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(openssl rand -hex 32)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
FRONTEND_URL=https://admin.fastprepusa.com

# Messenger API Keys (Add your actual keys)
WHATSAPP_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
FACEBOOK_ACCESS_TOKEN=your-facebook-page-access-token
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@fastprepusa.com

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WordPress Integration
WORDPRESS_WEBHOOK_SECRET=your-webhook-secret-$(openssl rand -hex 16)
EOF

# Frontend .env for production
cat > frontend/.env.production << 'EOF'
REACT_APP_API_URL=https://admin.fastprepusa.com/api
REACT_APP_SOCKET_URL=https://admin.fastprepusa.com
GENERATE_SOURCEMAP=false
EOF

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads
chmod 755 backend/uploads

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
chmod 755 logs

# Update package.json scripts for production
print_status "Updating package.json scripts..."

# Backend package.json updates
cd backend
if ! grep -q "migrate" package.json; then
    npm pkg set scripts.migrate="sequelize-cli db:migrate"
    npm pkg set scripts.migrate:undo="sequelize-cli db:migrate:undo"
    npm pkg set scripts.seed="sequelize-cli db:seed:all"
fi
cd ..

# Frontend package.json updates
cd frontend
if ! grep -q "build:prod" package.json; then
    npm pkg set scripts.build:prod="REACT_APP_ENV=production npm run build"
fi
cd ..

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'fastprep-admin-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: './backend/.env.production',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    },
    {
      name: 'fastprep-admin-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'build']
    }
  ]
};
EOF

# Create deployment script
print_status "Creating deployment script..."
cat > deploy-production.sh << 'EOF'
#!/bin/bash

# Fast Prep Admin Panel - Production Deploy Script
set -e

echo "🚀 Deploying Fast Prep Admin Panel to Production..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install it first: npm install -g pm2"
    exit 1
fi

# Check if serve is installed
if ! command -v serve &> /dev/null; then
    print_status "Installing serve..."
    npm install -g serve
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --production
cd ..

# Run database migrations
print_status "Running database migrations..."
cd backend
npm run migrate
cd ..

# Build frontend
print_status "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start PM2 processes
print_status "Starting PM2 processes..."
pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Show status
print_status "Deployment completed!"
pm2 status

echo ""
echo "✅ Fast Prep Admin Panel deployed successfully!"
echo "🌐 Backend API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart ecosystem.config.js"
EOF

chmod +x deploy-production.sh

# Create messenger webhook test script
print_status "Creating messenger webhook test script..."
cat > test-webhooks.sh << 'EOF'
#!/bin/bash

# Test webhook endpoints for messengers
echo "🧪 Testing Messenger Webhooks..."

BASE_URL="http://localhost:5000/api/webhooks"

echo "Testing webhook health check..."
curl -X GET "$BASE_URL/health" -H "Content-Type: application/json"

echo -e "\n\nTesting WhatsApp webhook..."
curl -X POST "$BASE_URL/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "id": "test_message_id",
            "from": "1234567890",
            "timestamp": "1640995200",
            "text": {
              "body": "Test message from WhatsApp"
            }
          }]
        }
      }]
    }]
  }'

echo -e "\n\nTesting Telegram webhook..."
curl -X POST "$BASE_URL/telegram" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1640995200,
      "text": "Test message from Telegram"
    }
  }'

echo -e "\n\nTesting WordPress webhook..."
curl -X POST "$BASE_URL/wordpress" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "message": "Test lead from WordPress form"
  }'

echo -e "\n\n✅ Webhook tests completed!"
EOF

chmod +x test-webhooks.sh

# Create database setup script
print_status "Creating database setup script..."
cat > setup-database.sh << 'EOF'
#!/bin/bash

# Database setup script for Fast Prep Admin Panel
echo "🗄️ Setting up database..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[DB]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f "backend/.env.production" ]; then
    print_error "Please run setup-env.sh first to create environment files"
    exit 1
fi

# Load environment variables
export $(cat backend/.env.production | grep -v '^#' | xargs)

print_status "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"

# Test database connection
print_status "Testing database connection..."
cd backend
npm run migrate:status

# Run migrations
print_status "Running database migrations..."
npm run migrate

# Seed initial data
print_status "Seeding initial data..."
npm run seed

print_status "Database setup completed!"
print_warning "Default admin credentials:"
echo "Email: admin@fastprepusa.com"
echo "Password: admin123"
echo ""
echo "⚠️  Please change the default password after first login!"
EOF

chmod +x setup-database.sh

# Create SSL setup script
print_status "Creating SSL setup script..."
cat > setup-ssl.sh << 'EOF'
#!/bin/bash

# SSL setup script for Fast Prep Admin Panel
echo "🔒 Setting up SSL certificate..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[SSL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

DOMAIN="admin.fastprepusa.com"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed. Please install it first."
    exit 1
fi

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/fastprep-admin > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Let Certbot handle the redirect to HTTPS
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/fastprep-admin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate
print_status "Obtaining SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@fastprepusa.com

print_status "SSL setup completed!"
print_warning "Your site is now available at: https://$DOMAIN"
EOF

chmod +x setup-ssl.sh

print_status "Production environment setup completed!"
print_warning "Next steps:"
echo "1. Edit backend/.env.production with your actual configuration"
echo "2. Run: ./setup-database.sh"
echo "3. Run: ./deploy-production.sh"
echo "4. Run: ./setup-ssl.sh (for SSL certificate)"
echo "5. Run: ./test-webhooks.sh (to test messenger integration)"

echo ""
echo "🎉 Fast Prep USA Admin Panel production setup is ready!"
echo "📁 Environment files created:"
echo "   - backend/.env.production"
echo "   - frontend/.env.production"
echo "   - ecosystem.config.js"
echo "   - deploy-production.sh"
echo "   - setup-database.sh"
echo "   - setup-ssl.sh"
echo "   - test-webhooks.sh"
