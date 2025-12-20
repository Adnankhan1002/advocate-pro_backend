# Advocate Pro - SaaS Backend

A production-ready multi-tenant SaaS platform for advocate services built with Node.js, Express, and MongoDB Atlas.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with tenant-scoped queries
- **JWT Authentication**: Secure token-based authentication with role-based access control (RBAC)
- **Tenant Sign-up**: Seamless sign-up flow creating both tenant and first user (OWNER role)
- **User Management**: Create, read, update, and delete users within tenants
- **Subscription Management**: Support for different subscription plans and tiers
- **Security**: Password hashing, CORS, helmet security headers, input validation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Express Server (Node.js)  │
        └────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   ┌──────────┐          ┌──────────────┐
   │Auth      │          │Protected     │
   │Middleware│          │Routes        │
   │          │          │              │
   │- JWT     │          │- User CRUD   │
   │  Verify  │          │- Tenant Info │
   │- Tenant  │          │- Billing     │
   │  Inject  │          └──────────────┘
   └──────────┘
        │
        ▼
   ┌──────────────────┐
   │ MongoDB Atlas    │
   │ Cluster          │
   │                  │
   │ Collections:     │
   │ - Tenants        │
   │ - Users          │
   └──────────────────┘
```

## Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Auth business logic
│   ├── middleware/
│   │   └── auth.js              # Auth & tenant middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Tenant.js            # Tenant schema
│   ├── routes/
│   │   ├── authRoutes.js        # Sign-up, login
│   │   ├── userRoutes.js        # User management
│   │   └── tenantRoutes.js      # Tenant management
│   ├── utils/
│   │   └── jwt.js               # JWT token utils
│   └── server.js                # Main entry point
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## Installation

### Prerequisites

- Node.js v14+ 
- MongoDB Atlas account & cluster
- npm or yarn

### Setup Steps

1. **Clone and Install Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/advocate-pro?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   For production:
   ```bash
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### Sign Up (Create Tenant + First User)
```http
POST /api/auth/signup
Content-Type: application/json

{
  "tenantName": "Advocate Pro Law Firm",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Advocate Pro Law Firm",
      "slug": "advocate-pro-law-firm"
    },
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "OWNER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Advocate Pro Law Firm",
      "slug": "advocate-pro-law-firm"
    },
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Advocate Pro Law Firm",
      "slug": "advocate-pro-law-firm"
    },
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "OWNER"
    }
  }
}
```

### User Management Endpoints

#### Get All Users in Tenant
```http
GET /api/users/users
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create New User
```http
POST /api/users/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "role": "ADVOCATE"
}
```

#### Get User by ID
```http
GET /api/users/users/{userId}
Authorization: Bearer {token}
```

#### Update User
```http
PUT /api/users/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ADVOCATE"  // Only for OWNER/ADMIN
}
```

#### Delete User
```http
DELETE /api/users/users/{userId}
Authorization: Bearer {token}
```

### Tenant Management Endpoints

#### Get Tenant Info
```http
GET /api/tenant/info
Authorization: Bearer {token}
```

#### Update Tenant Info
```http
PUT /api/tenant/info
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Firm Name",
  "timezone": "America/New_York",
  "language": "en",
  "website": "https://example.com",
  "logo": "https://example.com/logo.png"
}
```

#### Get Subscription Info
```http
GET /api/tenant/subscription
Authorization: Bearer {token}
```

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **OWNER** | Full access, can manage users, change plan, billing |
| **ADMIN** | Can manage users, view analytics, manage settings |
| **ADVOCATE** | Can access cases, create documents, manage own clients |
| **STAFF** | Can assist with cases, access shared resources |
| **CLIENT** | Read-only access to their cases |

## Authentication Flow

### Sign-Up Flow
```
1. Client submits: tenantName, firstName, lastName, email, password
   ↓
2. Validate input (Joi schema)
   ↓
3. Check if email exists (User collection)
   ↓
4. Check if tenant email exists (Tenant collection)
   ↓
5. Create Tenant with unique slug
   ↓
6. Create User with role=OWNER, tenantId=Tenant._id
   ↓
7. Generate JWT token
   ↓
8. Return token + user + tenant info
```

### Login Flow
```
1. Client submits: email, password
   ↓
2. Find User by email (with password field selected)
   ↓
3. Verify user is active
   ↓
4. Compare password with bcrypt
   ↓
5. Update lastLogin timestamp
   ↓
6. Generate JWT token with userId, tenantId, role
   ↓
7. Return token + user + tenant info
```

### Protected Route Flow
```
1. Client sends request with Authorization: Bearer {token}
   ↓
2. authMiddleware extracts & verifies token
   ↓
3. Inject user claims: userId, tenantId, role
   ↓
4. tenantMiddleware injects tenantId for queries
   ↓
5. (Optional) authorizeRole checks role permissions
   ↓
6. Controller executes with tenant-scoped queries
```

## JWT Token Structure

```javascript
{
  userId: "507f1f77bcf86cd799439012",      // User's MongoDB _id
  tenantId: "507f1f77bcf86cd799439011",    // Tenant's MongoDB _id
  role: "OWNER",                            // User's role in tenant
  iat: 1705316400,                          // Issued at
  exp: 1706525200                           // Expires at (7 days)
}
```

## Tenant Isolation Strategy

Every protected route automatically applies tenant filtering:

```javascript
// In controllers, use this pattern:
const filter = req.getTenantFilter();  // Returns { tenantId: req.tenantId }

// Example: Get users only for current tenant
const users = await User.find({
  ...filter,  // Ensures tenant isolation
  isActive: true
});
```

This ensures:
- ✓ Users can only access data from their own tenant
- ✓ No cross-tenant data leakage
- ✓ RBAC works within tenant context
- ✓ Subscription limits per tenant

## Security Best Practices Implemented

- ✓ **Password Hashing**: bcryptjs with salt rounds 10
- ✓ **JWT Security**: Signed tokens with expiration
- ✓ **CORS**: Configured for specific origins
- ✓ **Security Headers**: Helmet middleware
- ✓ **Input Validation**: Joi schema validation
- ✓ **Tenant Isolation**: Every query scoped to tenant
- ✓ **Role-Based Access**: RBAC middleware
- ✓ **Error Handling**: Secure error messages
- ✓ **Environment Variables**: Secrets not in code

## Database Indexes

The following indexes are created for optimal performance:

```javascript
// Tenant collection
- { slug: 1 }
- { email: 1 }

// User collection
- { tenantId: 1, email: 1 } (unique per tenant)
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "details": [],  // For validation errors
  "error": "detailed error"  // Only in development
}
```

Common HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (duplicate email/resource)
- `500` - Internal Server Error

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection string

# JWT
JWT_SECRET=your_secret_key            # Secret key for signing tokens
JWT_EXPIRE=7d                          # Token expiration time

# Server
PORT=5000                              # Server port
NODE_ENV=development|production        # Environment

# CORS
CORS_ORIGIN=http://localhost:3000      # Allowed frontend origin
```

## MongoDB Atlas Setup

### Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and sign in
3. Create new project
4. Build a cluster (M0 free tier for development)
5. Add database user with username and password
6. Whitelist IP addresses (0.0.0.0/0 for development)
7. Get connection string

### Connection String Format
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```

## Next Steps (Enhancement Ideas)

- [ ] Email verification for sign-up
- [ ] Password reset flow
- [ ] OAuth2/SSO integration
- [ ] Two-factor authentication (2FA)
- [ ] Activity logging/audit trails
- [ ] Rate limiting
- [ ] API key authentication
- [ ] Webhook support
- [ ] File uploads (S3 integration)
- [ ] Case management models
- [ ] Billing/payment integration
- [ ] Analytics dashboard
- [ ] Email notifications

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Deployment

### Heroku
```bash
git push heroku main
```

### AWS/Azure/GCP
Use containerization with Docker and deploy to your cloud platform.

## Support & Contribution

For issues and questions, please create an issue in the repository.

## License

ISC
