# 🚀 Vercel Deployment Guide for NextTV CMS

## Prerequisites
- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository
```bash
cd c:\Users\Adem\Desktop\nEXTtv\server
git init
git add .
git commit -m "Initial commit - NextTV CMS"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `nexttv-cms`)
3. Don't initialize with README (we already have code)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/nexttv-cms.git
git branch -M main
git push -u origin main
```

## Step 2: Setup MongoDB Atlas (Free Tier)

### 2.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free
3. Create a new cluster (M0 Free tier)

### 2.2 Configure Database Access
1. Go to "Database Access"
2. Add new database user
3. Set username and password (save these!)
4. Set privileges to "Read and write to any database"

### 2.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### 2.4 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `nexttv` (or your preferred name)

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nexttv?retryWrites=true&w=majority
```

## Step 3: Deploy to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository (`nexttv-cms`)
3. Vercel will auto-detect Next.js

### 3.3 Configure Environment Variables
Before deploying, add these environment variables:

**Required Variables:**
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `JWT_SECRET` = A random secret key (e.g., `your-super-secret-jwt-key-change-this`)
- `NEXT_PUBLIC_API_URL` = Leave empty (will use relative paths)
- `NODE_ENV` = `production`

**Optional Variables:**
- `PORT` = `3000` (Vercel handles this automatically)

### 3.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. You'll get a URL like: `https://nexttv-cms.vercel.app`

## Step 4: Initialize Admin User

### 4.1 Create Admin via API
Once deployed, visit:
```
https://your-app.vercel.app/api/init-admin
```

This will create the admin user:
- Email: `admin@nexttv.com`
- Password: `admin123456`

### 4.2 Login
Go to:
```
https://your-app.vercel.app/login
```

## Step 5: Update Flutter App

Update your Flutter app's API URL to point to Vercel:
```dart
static const String baseUrl = 'https://your-app.vercel.app/api';
```

## 🎉 You're Done!

Your NextTV CMS is now live at:
- **Dashboard:** `https://your-app.vercel.app/dashboard`
- **API:** `https://your-app.vercel.app/api`

## 📝 Important Notes

### Free Tier Limitations
- **Vercel Free:**
  - 100 GB bandwidth/month
  - Serverless function timeout: 10 seconds
  - 100 deployments/day
  
- **MongoDB Atlas Free (M0):**
  - 512 MB storage
  - Shared RAM
  - No backups

### Security Recommendations
1. **Change default admin password** immediately after first login
2. **Use strong JWT_SECRET** (generate with: `openssl rand -base64 32`)
3. **Enable MongoDB IP whitelist** for production
4. **Add custom domain** (optional, but recommended)

### Custom Domain (Optional)
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Continuous Deployment
Every time you push to GitHub `main` branch, Vercel will automatically:
1. Build your app
2. Run tests (if configured)
3. Deploy to production

## 🔧 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### Database Connection Issues
- Verify MongoDB connection string
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Ensure database user has correct permissions

### API Not Working
- Check Vercel function logs
- Verify environment variables
- Test API endpoints individually

## 📚 Useful Commands

### Local Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Deploy from CLI
```bash
npm i -g vercel
vercel login
vercel
```

## 🆘 Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/

---

**Created for NextTV CMS**
