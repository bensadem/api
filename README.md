# NextTV CMS

Modern IPTV Content Management System built with Next.js 14, TypeScript, and MongoDB.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/nexttv-cms)

## 📋 Features

- 🎬 **Content Management**: Manage channels, movies, and series
- 👥 **User Management**: Admin and user roles
- 🔐 **Authentication**: JWT-based secure authentication
- 📊 **Analytics Dashboard**: Real-time statistics and insights
- 🎫 **Activation Codes**: Device activation system
- 🌙 **Dark Theme**: Modern, beautiful UI
- 📱 **Responsive Design**: Works on all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **Authentication**: JWT
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/nexttv-cms.git
cd nexttv-cms
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/nexttv
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
PORT=3000
```

4. **Run development server**
```bash
npm run dev
```

5. **Initialize admin user**
Visit: `http://localhost:3000/api/init-admin`

6. **Login**
- URL: `http://localhost:3000/login`
- Email: `admin@nexttv.com`
- Password: `admin123456`

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy Steps:
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 📁 Project Structure

```
server/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication
│   │   │   └── admin/         # Admin endpoints
│   │   ├── dashboard/         # Dashboard pages
│   │   └── login/             # Login page
│   └── lib/                   # Utilities
│       ├── db/                # Database
│       │   ├── connection.ts  # MongoDB connection
│       │   └── models/        # Mongoose models
│       ├── api.ts             # API client
│       └── auth.ts            # Auth store
├── public/                    # Static files
├── .env                       # Environment variables
└── package.json
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `NEXT_PUBLIC_API_URL` | API base URL | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `PORT` | Server port (default: 3000) | ❌ |

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get user profile

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/channels` - List channels
- `POST /api/admin/channels` - Create channel
- `GET /api/admin/movies` - List movies
- `GET /api/admin/series` - List series
- `GET /api/admin/users` - List users
- `GET /api/admin/activation-codes` - List codes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for NextTV**
