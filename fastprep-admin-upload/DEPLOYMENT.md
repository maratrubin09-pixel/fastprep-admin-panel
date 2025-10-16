# Fast Prep USA Admin Panel - Deployment Guide

## 📋 Project Overview

Multi-platform admin panel for Fast Prep USA with CRM, messenger integration, and task management.

**Live URLs:**
- Frontend: https://admin.fastprepusa.com (Vercel)
- Backend: https://fastprep-admin-backend.onrender.com (Render)
- Repository: https://github.com/maratrubin09-pixel/fastprep-admin-panel

## 🏗️ Architecture

### Frontend (Vercel)
- React + TypeScript + Material-UI application
- Environment variable: `REACT_APP_API_URL` → Backend API URL
- Auto-deploys from `main` branch

### Backend (Render)
- Node.js/Express API
- PostgreSQL database (Render managed)
- Root Directory: `backend`
- Environment variables:
  - `DATABASE_URL` → PostgreSQL connection string
  - `NODE_ENV=production`
  - `JWT_SECRET` → For authentication
  - `FRONTEND_URL` → Frontend URL for CORS

## 🚀 Deployment Status

### ✅ Completed
1. Frontend built and ready for Vercel
2. Backend ready for Render deployment
3. Database schema created (users, customers, leads, conversations, messages, tasks)
4. API endpoints implemented:
   - `/api/auth` - Authentication
   - `/api/analytics` - Dashboard metrics
   - `/api/customers` - Customer management
   - `/api/leads` - Lead management
   - `/api/tasks` - Task management
   - `/api/messages` - Message inbox
   - `/api/messengers` - Messenger integration
5. SSL configuration ready
6. Documentation created

## 🔧 Setup Instructions

### Local Development

1. **Clone repository**
```bash
git clone https://github.com/maratrubin09-pixel/fastprep-admin-panel.git
cd fastprep-admin-panel
```

2. **Install all dependencies**
```bash
npm run install-all
```

3. **Backend setup**
```bash
cd backend
```

Create `.env` file:
```
DATABASE_URL=your_local_postgres_url
PORT=5001
NODE_ENV=development
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

4. **Frontend setup**
```bash
cd frontend
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5001
```

5. **Run locally**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Production Deployment

#### Vercel (Frontend)

1. Connect GitHub repository to Vercel
2. Set environment variable:
   - `REACT_APP_API_URL` = `https://fastprep-admin-backend.onrender.com`
3. Deploy from `main` branch

#### Render (Backend)

1. Create new Web Service
2. Connect GitHub repository
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `NODE_ENV=production`
   - `JWT_SECRET=your_secret_key`
   - `FRONTEND_URL=https://admin.fastprepusa.com`
5. Create PostgreSQL database (if not exists)

## 🗄️ Database Schema

### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### roles table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### customers table
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  tags TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### conversations table
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  messenger_type VARCHAR(50) NOT NULL,
  messenger_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  assigned_to INTEGER REFERENCES users(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### messages table
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_type VARCHAR(20) NOT NULL, -- 'user' or 'customer'
  sender_id INTEGER,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  metadata TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tasks table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP,
  tags TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/customers` - Customer analytics

### CRM
- `GET /api/customers` - Customer list
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Leads
- `GET /api/leads` - Lead list
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Tasks
- `GET /api/tasks` - Task list
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messages
- `GET /api/messages` - Message inbox
- `POST /api/messages` - Send message
- `GET /api/conversations` - Conversation list

### Messengers
- `POST /api/messengers/qr/generate` - Generate QR code
- `POST /api/messengers/whatsapp/connect` - Connect WhatsApp
- `GET /api/messengers/whatsapp/:sessionId/status` - WhatsApp status
- `POST /api/messengers/whatsapp/send` - Send WhatsApp message

## 🔐 Environment Variables

### Frontend (Vercel)
- `REACT_APP_API_URL` - Backend API URL

### Backend (Render)
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - production/development
- `PORT` - Server port (default: 5001)
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## 🐛 Troubleshooting

### Backend not starting
1. Check logs in Render dashboard
2. Verify `DATABASE_URL` is set correctly
3. Check database is running
4. Verify Root Directory is set to `backend`

### Frontend not connecting to backend
1. Verify `REACT_APP_API_URL` is set in Vercel
2. Check CORS is enabled in backend
3. Verify backend is accessible (not sleeping)

### Database connection errors
1. Check SSL settings in database config
2. Verify firewall allows connection
3. Ensure database credentials are correct

## 💰 Cost Breakdown

### Free Tier (Current)
- ✅ Vercel: Free (Frontend)
- ✅ Render: Free (Backend - sleeps after 15 min)
- ✅ Render PostgreSQL: Free (Limited)

**Limitations:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 20-30 seconds
- Database has storage/connection limits

### Paid Plan (Recommended for business)
- Vercel: Free (sufficient)
- Render Web Service: **$7/month** (no sleeping)
- Render PostgreSQL: $7/month or Free tier

**Benefits:**
- ✅ No sleeping - instant response
- ✅ Better performance
- ✅ More database storage
- ✅ Priority support

## 📝 Next Steps

1. **Deploy to GitHub**
   - Push code to GitHub repository
   - Set up GitHub Actions (optional)

2. **Deploy Frontend to Vercel**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

3. **Deploy Backend to Render**
   - Create Web Service
   - Set Root Directory to `backend`
   - Configure environment variables
   - Deploy

4. **Test Integration**
   - Verify frontend connects to backend
   - Test all API endpoints
   - Check database connectivity

5. **Add Sample Data**
   - Insert test users, customers, leads
   - Test dashboard display
   - Verify messenger integration

6. **Upgrade to Paid Plan** (When ready)
   - One-click upgrade in Render
   - No code changes needed

## 📞 Support

- GitHub Issues: https://github.com/maratrubin09-pixel/fastprep-admin-panel/issues
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com

---

**Last Updated:** October 15, 2025