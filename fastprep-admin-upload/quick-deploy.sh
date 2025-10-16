#!/bin/bash

# Quick deployment script for Fast Prep USA Admin Panel
# Usage: ./quick-deploy.sh your_digital_ocean_ip

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <digital_ocean_ip>"
    echo "Example: $0 123.456.789.0"
    exit 1
fi

SERVER_IP=$1
DOMAIN="admin.fastprepusa.com"
SERVER_USER="root"

echo "🚀 Quick deployment to Digital Ocean..."
echo "Server IP: $SERVER_IP"
echo "Domain: $DOMAIN"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
TEMP_DIR=$(mktemp -d)

# Copy backend
cp -r backend "$TEMP_DIR/"

# Copy frontend build
cp -r frontend/build "$TEMP_DIR/frontend"

# Create simple deployment script
cat > "$TEMP_DIR/simple-deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "Installing dependencies..."

# Update system
apt-get update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql << 'EOSQL'
CREATE DATABASE fastprep_admin;
CREATE USER fastprep_admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE fastprep_admin TO fastprep_admin;
\q
EOSQL

# Install Nginx
apt-get install -y nginx

# Create app directory
mkdir -p /var/www/fastprep-admin
mkdir -p /var/www/fastprep-admin/public

# Copy files
cp -r backend/* /var/www/fastprep-admin/
cp -r frontend/* /var/www/fastprep-admin/public/

# Install backend dependencies
cd /var/www/fastprep-admin
npm install

# Create production .env
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastprep_admin
DB_USER=fastprep_admin
DB_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this
FRONTEND_URL=https://admin.fastprepusa.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF

# Start with PM2
pm2 start server.js --name "fastprep-admin"
pm2 save
pm2 startup

echo "✅ Backend started with PM2"
EOF

chmod +x "$TEMP_DIR/simple-deploy.sh"

# Create Nginx config
cat > "$TEMP_DIR/nginx.conf" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Frontend
    location / {
        root /var/www/fastprep-admin/public;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Deploy to server
echo "🚀 Deploying to server..."
rsync -avz --delete "$TEMP_DIR/" "$SERVER_USER@$SERVER_IP:/tmp/fastprep-deploy/"

# Run deployment on server
ssh "$SERVER_USER@$SERVER_IP" "cd /tmp/fastprep-deploy && sudo ./simple-deploy.sh"

# Configure Nginx
echo "🔧 Configuring Nginx..."
ssh "$SERVER_USER@$SERVER_IP" "sudo cp /tmp/fastprep-deploy/nginx.conf /etc/nginx/sites-available/fastprep-admin"
ssh "$SERVER_USER@$SERVER_IP" "sudo ln -sf /etc/nginx/sites-available/fastprep-admin /etc/nginx/sites-enabled/"
ssh "$SERVER_USER@$SERVER_IP" "sudo rm -f /etc/nginx/sites-enabled/default"
ssh "$SERVER_USER@$SERVER_IP" "sudo nginx -t && sudo systemctl reload nginx"

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL..."
ssh "$SERVER_USER@$SERVER_IP" "sudo apt-get install -y certbot python3-certbot-nginx"
ssh "$SERVER_USER@$SERVER_IP" "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@fastprepusa.com"

# Cleanup
rm -rf "$TEMP_DIR"

echo "🎉 Deployment completed!"
echo "Your application is available at: https://$DOMAIN"
echo "Admin login: admin@fastprepusa.com / admin123"
echo ""
echo "Next steps:"
echo "1. Update DNS records to point $DOMAIN to $SERVER_IP"
echo "2. Change default passwords in production"
echo "3. Configure SSL certificates if needed"
