# Implementation Details & Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                             │
│  (Web Browser, Mobile App, Desktop Client, Third-party Integrations)    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                    HTTPS (TLS/SSL Encrypted)
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                       EXPRESS.JS SERVER                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE STACK                                │ │
│  │  1. helmet() ──────► Security headers                             │ │
│  │  2. cors() ─────────► CORS configuration                          │ │
│  │  3. express.json() ─► Parse JSON requests                         │ │
│  │  4. authMiddleware ─► Verify JWT token                            │ │
│  │  5. tenantMiddleware► Inject tenantId                             │ │
│  │  6. authorizeRole() ► RBAC enforcement                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                               │                                          │
│  ┌────────────────────────────▼────────────────────────────────────────┐ │
│  │                      ROUTE HANDLERS                                 │ │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Auth Routes  │  │  User Routes  │  │  Tenant Routes           │ │ │
│  │  ├─ POST /signup│  ├─ GET /users   │  ├─ GET /info              │ │ │
│  │  ├─ POST /login │  ├─ POST /users  │  ├─ PUT /info              │ │ │
│  │  └─ GET /me     │  ├─ PUT /users   │  └─ GET /subscription      │ │ │
│  │                  │  └─ DELETE /users│                             │ │ │
│  │                  │                  │                             │ │ │
│  └──────────────────┴──────────────────┴─────────────────────────────┘ │ │
│                               │                                          │
│  ┌────────────────────────────▼────────────────────────────────────────┐ │
│  │                     CONTROLLERS                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │ authController.js                                           │  │ │
│  │  │ ├─ signup()  → Creates tenant + user + JWT                  │  │ │
│  │  │ ├─ login()   → Authenticates + returns JWT                  │  │ │
│  │  │ └─ getCurrentUser() → Returns user profile                  │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  Other controllers handle user and tenant operations              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
    MongoDB DRIVER                         JWT VERIFICATION
    (Mongoose)                                   │
            │                          ├─ Verify signature
            ▼                          ├─ Check expiration
    ┌──────────────────────────┐      ├─ Extract claims
    │   MONGODB ATLAS          │      └─ Inject to req.user
    │                          │
    │ ┌────────────────────┐  │
    │ │ Tenants            │  │
    │ │ Collection         │  │
    │ │ ├─ _id             │  │
    │ │ ├─ name            │  │
    │ │ ├─ slug            │  │
    │ │ ├─ subscription    │  │
    │ │ ├─ settings        │  │
    │ │ └─ isActive        │  │
    │ └────────────────────┘  │
    │                          │
    │ ┌────────────────────┐  │
    │ │ Users              │  │
    │ │ Collection         │  │
    │ │ ├─ _id             │  │
    │ │ ├─ tenantId (FK)   │  │
    │ │ ├─ firstName       │  │
    │ │ ├─ email           │  │
    │ │ ├─ password (hash) │  │
    │ │ ├─ role            │  │
    │ │ └─ isActive        │  │
    │ └────────────────────┘  │
    │                          │
    └──────────────────────────┘
```

---

## Data Flow: Sign-Up Process

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SENDS                              │
│  POST /api/auth/signup                                       │
│  {                                                            │
│    tenantName: "Smith Law Firm",                             │
│    firstName: "John",                                        │
│    lastName: "Doe",                                          │
│    email: "john@example.com",                                │
│    password: "SecurePass123"                                 │
│  }                                                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 1. VALIDATION                       │
        │ ├─ Validate all fields with Joi    │
        │ ├─ Check email format              │
        │ ├─ Password min length 6           │
        │ └─ Return 400 if invalid           │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 2. UNIQUENESS CHECKS                │
        │ ├─ User.findOne({email})           │
        │ │  → Return 409 if exists          │
        │ ├─ Tenant.findOne({email})         │
        │ │  → Return 409 if exists          │
        │ └─ Proceed if both unique          │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 3. GENERATE UNIQUE SLUG             │
        │ ├─ slugify("Smith Law Firm")       │
        │ │  → "smith-law-firm"              │
        │ ├─ Check if exists in DB           │
        │ └─ Append counter if needed        │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 4. CREATE TENANT                    │
        │ ├─ New Tenant({                     │
        │ │   name: "Smith Law Firm",        │
        │ │   slug: "smith-law-firm",        │
        │ │   email: "john@example.com",     │
        │ │   subscription: {                │
        │ │     plan: "free",                │
        │ │     status: "active"             │
        │ │   },                             │
        │ │   settings: {...}                │
        │ │ })                               │
        │ ├─ await tenant.save()             │
        │ └─ Returns: tenant._id             │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 5. CREATE USER                      │
        │ ├─ New User({                       │
        │ │   tenantId: tenant._id,          │
        │ │   firstName: "John",             │
        │ │   lastName: "Doe",               │
        │ │   email: "john@example.com",     │
        │ │   password: "SecurePass123",     │
        │ │   role: "OWNER"                  │
        │ │ })                               │
        │ ├─ Pre-save: Hash password         │
        │ │  bcrypt.hash(password, 10)      │
        │ ├─ await user.save()               │
        │ └─ Returns: user._id               │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 6. GENERATE JWT TOKEN               │
        │ ├─ jwt.sign({                       │
        │ │   userId: user._id,              │
        │ │   tenantId: tenant._id,          │
        │ │   role: "OWNER"                  │
        │ │ }, JWT_SECRET, {                 │
        │ │   expiresIn: "7d"                │
        │ │ })                               │
        │ └─ Returns: encoded JWT            │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ 7. RETURN RESPONSE                  │
        │ Status: 201 Created                 │
        │ {                                   │
        │   success: true,                   │
        │   data: {                          │
        │     tenant: {...},                 │
        │     user: {...},                   │
        │     token: "eyJhbGciOi..."         │
        │   }                                 │
        │ }                                   │
        └─────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  CLIENT RECEIVES    │
                    │  - Token stored in  │
                    │    localStorage     │
                    │  - User is logged in│
                    │  - Ready to access  │
                    │    protected routes │
                    └─────────────────────┘
```

---

## Data Flow: Protected Route Access

```
┌──────────────────────────────────────────────────────────────┐
│               CLIENT SENDS AUTHENTICATED REQUEST              │
│  GET /api/users/users                                         │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..│
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ MIDDLEWARE 1: Extract Token          │
        │ ├─ Get from Authorization header     │
        │ ├─ Remove "Bearer " prefix           │
        │ └─ Validate format                   │
        └──────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ MIDDLEWARE 2: authMiddleware         │
        │ ├─ jwt.verify(token, JWT_SECRET)    │
        │ ├─ Decode and validate signature    │
        │ ├─ Check expiration                 │
        │ ├─ Return 401 if invalid            │
        │ ├─ Extract: userId, tenantId, role  │
        │ └─ Set: req.user = {...}            │
        └──────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ MIDDLEWARE 3: tenantMiddleware       │
        │ ├─ Check req.user exists             │
        │ ├─ Set req.tenantId                  │
        │ ├─ Add getTenantFilter() method      │
        │ │  Returns: { tenantId: req.tenantId }
        │ └─ Continue to next middleware       │
        └──────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ MIDDLEWARE 4: authorizeRole()        │
        │ (If route is protected by role)      │
        │ ├─ Check req.user.role               │
        │ ├─ Compare with allowed roles        │
        │ ├─ Return 403 if unauthorized        │
        │ └─ Continue if authorized            │
        └──────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ CONTROLLER: getUsersInTenant         │
        │ ├─ Get tenant filter:                │
        │ │  filter = req.getTenantFilter()    │
        │ │  → { tenantId: "tenant-id" }       │
        │ ├─ Query database:                   │
        │ │  User.find(filter)                 │
        │ │    .select('-password')            │
        │ │    .lean()                         │
        │ ├─ Returns only tenant's users       │
        │ └─ Process data                      │
        └──────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────┐
        │ RETURN RESPONSE                      │
        │ Status: 200 OK                       │
        │ {                                    │
        │   success: true,                    │
        │   data: [{                           │
        │     _id: "...",                      │
        │     firstName: "Jane",               │
        │     role: "ADVOCATE"                 │
        │   }]                                 │
        │ }                                    │
        └──────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: NETWORK LEVEL                                    │
│  ├─ HTTPS/TLS Encryption                                   │
│  ├─ Firewall Rules                                         │
│  └─ DDoS Protection (if using CDN)                         │
│                                                              │
│  LAYER 2: APPLICATION LEVEL                                │
│  ├─ Helmet Security Headers                                │
│  │  ├─ X-Content-Type-Options: nosniff                     │
│  │  ├─ X-Frame-Options: DENY                               │
│  │  └─ Content-Security-Policy                             │
│  ├─ CORS Configuration                                     │
│  │  ├─ Whitelist specific origins                          │
│  │  └─ Restrict HTTP methods                               │
│  └─ Input Validation (Joi)                                 │
│     ├─ Type checking                                        │
│     ├─ String length limits                                 │
│     ├─ Email format validation                              │
│     └─ Enum constraints                                     │
│                                                              │
│  LAYER 3: AUTHENTICATION                                   │
│  ├─ JWT Token Security                                     │
│  │  ├─ HS256 signing algorithm                             │
│  │  ├─ Secret key (never hardcoded)                        │
│  │  ├─ Token expiration (7 days)                           │
│  │  └─ Signature verification on every request             │
│  ├─ Password Hashing                                       │
│  │  ├─ bcryptjs with 10 salt rounds                        │
│  │  ├─ Timing attack resistant                             │
│  │  └─ Never stored in plain text                          │
│  └─ Session Management                                     │
│     ├─ lastLogin tracking                                   │
│     └─ isActive flag enforcement                            │
│                                                              │
│  LAYER 4: AUTHORIZATION (RBAC)                             │
│  ├─ Role-Based Access Control                              │
│  │  ├─ OWNER → Full access                                 │
│  │  ├─ ADMIN → Manage users & settings                     │
│  │  ├─ ADVOCATE → Manage own cases                         │
│  │  ├─ STAFF → Assist with cases                           │
│  │  └─ CLIENT → View own cases                             │
│  └─ Granular Permissions (future)                          │
│                                                              │
│  LAYER 5: DATA LEVEL                                       │
│  ├─ Tenant Isolation                                       │
│  │  ├─ Every query filters by tenantId                     │
│  │  ├─ No cross-tenant data access                         │
│  │  └─ Enforced at middleware + DB index                   │
│  ├─ Database Constraints                                   │
│  │  ├─ Unique indexes on email per tenant                  │
│  │  ├─ Required fields validation                          │
│  │  └─ Data type constraints                               │
│  └─ Encryption (optional)                                  │
│     ├─ Password hashing with bcrypt                        │
│     └─ TLS for data in transit                             │
│                                                              │
│  LAYER 6: ERROR HANDLING                                   │
│  ├─ No Stack Traces in Production                          │
│  ├─ Secure Error Messages                                  │
│  │  ├─ "Invalid email or password" (not "User not found")  │
│  │  └─ Prevents user enumeration                           │
│  ├─ Logging (without sensitive data)                       │
│  └─ Rate Limiting (future)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Indexes Strategy

```
TENANT COLLECTION
├─ Index 1: { slug: 1 }
│  Purpose: Fast lookup for unique tenant slug
│  Usage: When generating unique slugs during signup
│  Query: db.tenants.findOne({ slug: "my-firm" })
│  Performance: O(log N) instead of O(N)
│
└─ Index 2: { email: 1 }
   Purpose: Check email uniqueness across platform
   Usage: Prevent duplicate tenant emails
   Query: db.tenants.findOne({ email: "admin@firm.com" })
   Performance: O(log N) lookup

USER COLLECTION
├─ Index 1: { tenantId: 1, email: 1 } (UNIQUE)
│  Purpose: Email unique per tenant, fast lookup
│  Usage: All user queries within a tenant
│  Query: db.users.findOne({ tenantId: "...", email: "..." })
│  Properties: 
│  - Unique: Can't have duplicate emails in same tenant
│  - Compound: Must use both fields together (most efficient)
│  Performance: O(log N) compound key lookup
│
└─ Index 2: { tenantId: 1 } (Implicit from compound index)
   Purpose: Find all users in a tenant
   Usage: List users, tenant analytics
   Query: db.users.find({ tenantId: "..." })
   Performance: O(log N) to first match, then O(K) for K users

BENEFITS
├─ Faster read performance (especially important for large datasets)
├─ Ensures data integrity (unique constraints)
├─ Reduces memory usage (MongoDB uses indexes efficiently)
├─ Better scalability (handles millions of users)
└─ Automatic enforcement of business rules
```

---

## Performance Considerations

```
REQUEST LIFECYCLE & TIMING

1. CLIENT REQUEST (Instant)
   └─ HTTP request received

2. MIDDLEWARE PROCESSING (< 1ms)
   ├─ Parse JSON body
   ├─ Verify JWT signature
   ├─ Extract claims
   └─ Inject into request object

3. DATABASE QUERY (5-50ms depending on load)
   ├─ Connect to MongoDB (if needed)
   ├─ Query with index (O(log N))
   ├─ Fetch documents
   └─ Return to application

4. RESPONSE CONSTRUCTION (< 1ms)
   ├─ Serialize to JSON
   ├─ Set HTTP headers
   └─ Send to client

5. CLIENT RECEIVES (Instant)
   └─ Response processed by client

TOTAL TIME: ~10-60ms typical
(Includes network latency)

OPTIMIZATION TIPS:
├─ Use lean() queries (returns POJO, not Mongoose documents)
├─ Select only needed fields with .select()
├─ Implement pagination for large datasets
├─ Add database connection pooling
├─ Use caching layer (Redis)
├─ Monitor slow queries
└─ Scale horizontally (multiple server instances)
```

---

## Dependencies Explanation

```json
{
  "express": "^4.18.2"
    └─ Web framework for Node.js
       ├─ Handles HTTP routing
       ├─ Middleware support
       └─ Request/response handling

  "mongoose": "^8.0.0"
    └─ MongoDB ODM (Object Document Mapper)
       ├─ Schema validation
       ├─ Document relationships
       └─ Query building

  "bcryptjs": "^2.4.3"
    └─ Password hashing library
       ├─ Secure password storage
       ├─ Timing attack resistant
       └─ Configurable salt rounds

  "jsonwebtoken": "^9.1.2"
    └─ JWT creation and verification
       ├─ Token signing
       ├─ Token verification
       └─ Claim extraction

  "dotenv": "^16.3.1"
    └─ Environment variable management
       ├─ Load .env file
       ├─ Safe configuration
       └─ Non-committed secrets

  "cors": "^2.8.5"
    └─ Cross-Origin Resource Sharing
       ├─ Whitelist origins
       ├─ Allow credentials
       └─ Handle preflight requests

  "helmet": "^7.1.0"
    └─ Security middleware
       ├─ Security headers
       ├─ XSS protection
       └─ Clickjacking prevention

  "joi": "^17.11.0"
    └─ Data validation schema
       ├─ Input validation
       ├─ Schema building
       └─ Error messages
}
```

---

## Environment Variables Impact

```
MONGODB_URI
├─ Affects: Database connection
├─ Production impact: HIGH (all data depends on this)
├─ Example: mongodb+srv://user:pass@cluster.mongodb.net/db
└─ Security: Should never be in code

JWT_SECRET
├─ Affects: Token signing and verification
├─ Production impact: CRITICAL (security depends on this)
├─ Example: "your_super_secret_key_at_least_32_chars"
├─ Security: Must be strong and unique per environment
└─ Note: Same secret in all servers, different per environment

JWT_EXPIRE
├─ Affects: Token lifetime
├─ Production impact: MEDIUM (affects user session duration)
├─ Options: "7d", "24h", "8h"
└─ Trade-off: Shorter = more secure, longer = better UX

PORT
├─ Affects: Server listening port
├─ Production impact: LOW (configuration only)
├─ Typical values: 5000 (dev), 3000, 8000, 8080
└─ Cloud platforms: Often override with own PORT

NODE_ENV
├─ Affects: Error messages, logging, optimization
├─ Production impact: MEDIUM (security implications)
├─ Values: "development" or "production"
├─ In production: Don't show stack traces
└─ Dev: Verbose logging helps debugging

CORS_ORIGIN
├─ Affects: Which domains can access the API
├─ Production impact: HIGH (cross-origin requests blocked if wrong)
├─ Example: "https://yourdomain.com", "http://localhost:3000"
├─ Multiple origins: Use regex or array
└─ Never use: "*" in production
```

---

**Architecture complete and documented!** 🏗️

This comprehensive backend is ready for production deployment.
