#!/bin/bash

# Fast Prep USA Admin Panel - Deployment Script
# This script sets up the production environment on Digital Ocean

set -e

echo "🚀 Starting Fast Prep USA Admin Panel Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="admin.fastprepusa.com"
APP_DIR="/var/www/fastprep-admin"
BACKEND_PORT=5000
FRONTEND_PORT=3000
NGINX_CONF="/etc/nginx/sites-available/fastprep-admin"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PostgreSQL client
print_status "Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Install SSL certificate tool
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'fastprep-admin-backend',
      script: './backend/server.js',
      cwd: '/var/www/fastprep-admin',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'fastprep-admin-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: '/var/www/fastprep-admin/frontend',
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
      min_uptime: '10s'
    }
  ]
};
EOF

# Create logs directory
mkdir -p $APP_DIR/logs

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee $NGINX_CONF > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://$DOMAIN";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Socket.io for real-time communication
    location /socket.io/ {
        proxy_pass http://localhost:$BACKEND_PORT/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Webhooks for messengers
    location /webhooks/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/webhooks/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|sql)$ {
        deny all;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Create systemd service for PM2
print_status "Creating PM2 systemd service..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Create deployment script
print_status "Creating deployment script..."
cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash

# Fast Prep Admin Panel - Deploy Script
set -e

echo "🚀 Deploying Fast Prep Admin Panel..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Navigate to app directory
cd /var/www/fastprep-admin

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --production

# Run database migrations
print_status "Running database migrations..."
npm run migrate

# Build frontend
print_status "Building frontend..."
cd ../frontend
npm ci
npm run build

# Install serve globally if not installed
if ! command -v serve &> /dev/null; then
    print_status "Installing serve..."
    npm install -g serve
fi

# Restart PM2 processes
print_status "Restarting PM2 processes..."
cd ..
pm2 restart ecosystem.config.js

# Show status
print_status "Deployment completed!"
pm2 status

echo "✅ Fast Prep Admin Panel deployed successfully!"
echo "🌐 Access your admin panel at: https://admin.fastprepusa.com"
EOF

chmod +x $APP_DIR/deploy.sh

# Create environment setup script
print_status "Creating environment setup script..."
cat > $APP_DIR/setup-env.sh << 'EOF'
#!/bin/bash

# Environment setup script for Fast Prep Admin Panel

echo "🔧 Setting up environment variables..."

# Create .env file for backend
cat > backend/.env << 'ENVEOF'
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=fastprep_admin_prod
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
FRONTEND_URL=https://admin.fastprepusa.com

# Messenger API Keys
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
WORDPRESS_WEBHOOK_SECRET=your-webhook-secret
ENVEOF

# Create .env file for frontend
cat > frontend/.env << 'ENVEOF'
REACT_APP_API_URL=https://admin.fastprepusa.com/api
REACT_APP_SOCKET_URL=https://admin.fastprepusa.com
ENVEOF

echo "✅ Environment files created!"
echo "📝 Please edit backend/.env and frontend/.env with your actual values"
EOF

chmod +x $APP_DIR/setup-env.sh

print_status "Deployment setup completed!"
print_warning "Next steps:"
echo "1. Copy your application files to $APP_DIR"
echo "2. Run: cd $APP_DIR && ./setup-env.sh"
echo "3. Edit the .env files with your actual configuration"
echo "4. Run: sudo certbot --nginx -d $DOMAIN"
echo "5. Run: ./deploy.sh"

echo ""
echo "🎉 Fast Prep USA Admin Panel deployment setup is ready!"
echo "🌐 Your admin panel will be available at: https://$DOMAIN"
