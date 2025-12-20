# Quick Start Guide

Get your Advocate Pro Backend running in 5 minutes!

## 1. Prerequisites
- Node.js v14+ installed
- MongoDB Atlas account (free tier available)
- Code editor (VS Code recommended)

## 2. MongoDB Atlas Setup

### Step A: Create Cluster
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Create a Project"
4. Click "Build a Database"
5. Select "Shared" (Free M0 tier)
6. Choose your region (nearest to you)
7. Click "Create Cluster" (takes ~3 minutes)

### Step B: Create Database User
1. In the cluster dashboard, go to "Security" → "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Click "Add User"

### Step C: Whitelist IP
1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development only!)
4. Confirm

### Step D: Get Connection String
1. In cluster dashboard, click "Connect"
2. Select "Drivers"
3. Choose "Node.js"
4. Copy the connection string
5. Replace `<password>` with your database password

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/advocate-pro?retryWrites=true&w=majority
```

## 3. Setup Backend

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/advocate-pro?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_12345_change_this_in_production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Start Server
```bash
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
✓ Server is running on port 5000
✓ Environment: development
✓ API Base URL: http://localhost:5000/api
```

## 4. Test the API

### Option A: Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Create new request
3. Try Sign Up:

```
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "tenantName": "My Law Firm",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Test123456"
}
```

### Option B: Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "My Law Firm",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Test123456"
  }'
```

### Option C: Using REST Client (VS Code)
1. Install "REST Client" extension
2. Open `API_EXAMPLES.rest`
3. Click "Send Request" above the API calls

## 5. Understanding the Response

After sign-up, you'll get:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "tenant": {
      "id": "...",
      "name": "My Law Firm",
      "slug": "my-law-firm"
    },
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "OWNER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `token`** - you'll need it for authenticated requests!

## 6. Make Authenticated Requests

Use the token from sign-up to access protected routes:

```bash
# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get tenant info
curl http://localhost:5000/api/tenant/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a new user
curl -X POST http://localhost:5000/api/users/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@lawfirm.com",
    "role": "ADVOCATE"
  }'
```

## 7. Project Structure Tour

```
Backend/
├── src/
│   ├── server.js                 ← Main entry point
│   ├── config/
│   │   └── database.js           ← MongoDB connection
│   ├── models/
│   │   ├── User.js              ← User schema
│   │   └── Tenant.js            ← Tenant schema
│   ├── controllers/
│   │   └── authController.js    ← Business logic
│   ├── middleware/
│   │   └── auth.js              ← JWT & tenant verification
│   ├── routes/
│   │   ├── authRoutes.js        ← Sign-up, login
│   │   ├── userRoutes.js        ← User management
│   │   └── tenantRoutes.js      ← Tenant management
│   └── utils/
│       ├── jwt.js               ← Token generation
│       └── helpers.js           ← Utility functions
├── .env.example                 ← Environment template
├── package.json                 ← Dependencies
└── README.md                    ← Full documentation
```

## 8. Key Concepts

### Multi-Tenancy
- Each sign-up creates a **Tenant** (law firm) and a **User** (person)
- First user gets **OWNER** role
- Users are isolated per tenant
- Queries automatically filter by tenant

### JWT Token
- Contains: userId, tenantId, role
- Expires in 7 days
- Required for all protected routes
- Send via: `Authorization: Bearer {token}`

### Roles
- **OWNER**: Full access (can manage users, billing)
- **ADMIN**: Can manage users and settings
- **ADVOCATE**: Can manage cases and documents
- **STAFF**: Assists with cases
- **CLIENT**: Read-only access

### Authentication Flow
1. **Sign-up**: Create tenant + first user (OWNER)
2. **Login**: Get JWT token
3. **Protected routes**: Send token → Verify → Inject user data → Execute

## 9. Common Issues & Solutions

### MongoDB Connection Failed
- Check connection string in `.env`
- Verify IP is whitelisted in MongoDB Atlas
- Ensure database user password is correct
- Check internet connection

### "No token provided" Error
- Add `Authorization: Bearer YOUR_TOKEN` header
- Ensure token format is correct
- Check token hasn't expired

### "User not found after login"
- Ensure user was created during sign-up
- Check email matches exactly
- Verify tenant hasn't been deleted

### CORS Error
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Frontend should be on `http://localhost:3000`

## 10. Next Steps

1. **Setup Frontend**: Create React/Vue app connecting to this API
2. **Add Email**: Integrate SendGrid/Nodemailer for welcome emails
3. **Add Cases**: Create Case model and routes for case management
4. **Setup Payments**: Integrate Stripe for subscription billing
5. **Deploy**: Push to Heroku, AWS, or your hosting platform

## 11. Useful Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Install a new package
npm install package-name
```

## 12. Troubleshooting Checklist

Before asking for help:
- [ ] Node.js is v14+
- [ ] MongoDB connection string is correct
- [ ] `.env` file is configured
- [ ] Port 5000 is not in use
- [ ] MongoDB cluster is running
- [ ] IP is whitelisted in MongoDB Atlas
- [ ] Database user exists and has correct password

## 13. Support

For detailed API documentation, see `README.md`

For example requests, see `API_EXAMPLES.rest`

---

**You're all set!** 🚀

Your Advocate Pro Backend is ready to serve your SaaS platform.
