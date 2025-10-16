# Fast Prep USA Admin Panel

Multi-platform admin panel for Fast Prep USA with CRM, messenger integration, and task management.

## 🚀 Live URLs
- **Frontend**: https://admin.fastprepusa.com (Vercel)
- **Backend**: https://fastprep-admin-backend.onrender.com (Render)
- **Repository**: https://github.com/maratrubin09-pixel/fastprep-admin-panel

## 🏗️ Architecture

### Frontend (Vercel)
- React + TypeScript + Material-UI
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

## 📱 Features

- **Dashboard**: Analytics and metrics
- **CRM**: Customer and lead management
- **Messengers**: WhatsApp, Telegram, Facebook, Instagram integration
- **Tasks**: Employee task management
- **Users**: Role-based access control
- **Analytics**: Reports and statistics

## 🔐 Default Login
- **Email**: admin@fastprepusa.com
- **Password**: admin123

## 🚀 Quick Start

### Local Development
```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev
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

## 📡 API Endpoints

- `GET /api` - API information
- `POST /api/auth/login` - User login
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/customers` - Customer list
- `GET /api/leads` - Lead management
- `GET /api/tasks` - Task management
- `GET /api/messages` - Message inbox
- `POST /api/messengers/qr/generate` - Generate QR for messengers

## 🗄️ Database Schema

- **users** - User accounts and roles
- **customers** - Customer information
- **leads** - Lead management
- **conversations** - Messenger conversations
- **messages** - Individual messages
- **tasks** - Task management
- **activity_logs** - System activity tracking

## 💰 Cost Breakdown

### Free Tier (Current)
- ✅ Vercel: Free (Frontend)
- ✅ Render: Free (Backend - sleeps after 15 min)
- ✅ Render PostgreSQL: Free (Limited)

### Paid Plan (Recommended for business)
- Vercel: Free (sufficient)
- Render Web Service: **$7/month** (no sleeping)
- Render PostgreSQL: $7/month or Free tier

## 📞 Support

- GitHub Issues: https://github.com/maratrubin09-pixel/fastprep-admin-panel/issues
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com

---

**Last Updated:** October 15, 2025