# Production deployment script for Fast Prep USA Admin Panel
# This script deploys the application to Digital Ocean

set -e

echo "🚀 Starting deployment to Digital Ocean..."

# Configuration
DOMAIN="admin.fastprepusa.com"
SERVER_IP="your_digital_ocean_ip"
SERVER_USER="root"
APP_DIR="/var/www/fastprep-admin"
NGINX_CONFIG="/etc/nginx/sites-available/fastprep-admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH is required but not installed"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync is required but not installed"
        exit 1
    fi
    
    print_status "Requirements check passed"
}

# Build frontend for production
build_frontend() {
    print_status "Building frontend for production..."
    
    cd frontend
    
    # Install dependencies
    npm ci --only=production
    
    # Build the application
    npm run build
    
    cd ..
    
    print_status "Frontend build completed"
}

# Prepare backend for production
prepare_backend() {
    print_status "Preparing backend for production..."
    
    cd backend
    
    # Install production dependencies
    npm ci --only=production
    
    # Create production environment file
    cat > .env << EOF
NODE_ENV=production
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastprep_admin
DB_USER=fastprep_admin
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
FRONTEND_URL=https://${DOMAIN}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    cd ..
    
    print_status "Backend preparation completed"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy application files
    cp -r backend "$TEMP_DIR/"
    cp -r frontend/build "$TEMP_DIR/frontend"
    cp package.json "$TEMP_DIR/"
    cp README.md "$TEMP_DIR/"
    
    # Create deployment script
    cat > "$TEMP_DIR/deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying Fast Prep USA Admin Panel..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL
apt-get update
apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << 'EOSQL'
CREATE DATABASE fastprep_admin;
CREATE USER fastprep_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fastprep_admin TO fastprep_admin;
\q
EOSQL

# Install Nginx
apt-get install -y nginx

# Create application directory
mkdir -p /var/www/fastprep-admin
chown -R www-data:www-data /var/www/fastprep-admin

# Copy application files
cp -r backend/* /var/www/fastprep-admin/
cp -r frontend/* /var/www/fastprep-admin/public/

# Install backend dependencies
cd /var/www/fastprep-admin
npm install --production

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOCONFIG'
module.exports = {
  apps: [{
    name: 'fastprep-admin',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/pm2/fastprep-admin-error.log',
    out_file: '/var/log/pm2/fastprep-admin-out.log',
    log_file: '/var/log/pm2/fastprep-admin.log',
    time: true
  }]
};
EOCONFIG

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Application deployed successfully!"
EOF
    
    chmod +x "$TEMP_DIR/deploy.sh"
    
    print_status "Deployment package created in $TEMP_DIR"
    echo "$TEMP_DIR"
}

# Deploy to server
deploy_to_server() {
    local package_dir=$1
    
    print_status "Deploying to server $SERVER_IP..."
    
    # Copy files to server
    rsync -avz --delete "$package_dir/" "$SERVER_USER@$SERVER_IP:/tmp/fastprep-deployment/"
    
    # Run deployment script on server
    ssh "$SERVER_USER@$SERVER_IP" "cd /tmp/fastprep-deployment && sudo ./deploy.sh"
    
    print_status "Deployment to server completed"
}

# Configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration
    ssh "$SERVER_USER@$SERVER_IP" "sudo tee $NGINX_CONFIG > /dev/null" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration (you'll need to add your SSL certificates)
    ssl_certificate /etc/ssl/certs/fastprep-admin.crt;
    ssl_certificate_key /etc/ssl/private/fastprep-admin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend (React app)
    location / {
        root /var/www/fastprep-admin/public;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://$DOMAIN";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
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
    
    # File uploads
    location /uploads {
        alias /var/www/fastprep-admin/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
    
    # Enable site and restart Nginx
    ssh "$SERVER_USER@$SERVER_IP" "sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/"
    ssh "$SERVER_USER@$SERVER_IP" "sudo nginx -t && sudo systemctl reload nginx"
    
    print_status "Nginx configuration completed"
}

# Setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Install Certbot
    ssh "$SERVER_USER@$SERVER_IP" "sudo apt-get install -y certbot python3-certbot-nginx"
    
    # Get SSL certificate
    ssh "$SERVER_USER@$SERVER_IP" "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@fastprepusa.com"
    
    print_status "SSL certificate setup completed"
}

# Main deployment function
main() {
    print_status "Starting Fast Prep USA Admin Panel deployment..."
    
    # Check if domain and server IP are configured
    if [ "$SERVER_IP" = "your_digital_ocean_ip" ]; then
        print_error "Please configure SERVER_IP in the script"
        exit 1
    fi
    
    check_requirements
    build_frontend
    prepare_backend
    
    local package_dir=$(create_deployment_package)
    
    deploy_to_server "$package_dir"
    configure_nginx
    setup_ssl
    
    # Cleanup
    rm -rf "$package_dir"
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Your application is now available at: https://$DOMAIN"
    print_status "Admin credentials: admin@fastprepusa.com / admin123"
}

# Run main function
main "$@"
