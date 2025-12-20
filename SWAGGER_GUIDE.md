# Swagger API Documentation

Your API documentation is available at:

🔗 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

## Quick Links

### Authentication Endpoints
- **Sign Up**: `POST /api/auth/signup`
- **Login**: `POST /api/auth/login`
- **Get Current User**: `GET /api/auth/me`

### User Management Endpoints
- **List Users**: `GET /api/users/users`
- **Create User**: `POST /api/users/users`
- **Get User**: `GET /api/users/users/{userId}`
- **Update User**: `PUT /api/users/users/{userId}`
- **Delete User**: `DELETE /api/users/users/{userId}`

### Tenant Management Endpoints
- **Get Tenant Info**: `GET /api/tenant/info`
- **Update Tenant**: `PUT /api/tenant/info`
- **Get Subscription**: `GET /api/tenant/subscription`

## Features

✅ **Interactive Documentation**
- Try out API endpoints directly from the UI
- See request/response examples
- Download OpenAPI specification

✅ **Authentication**
- Copy JWT token from login response
- Use "Authorize" button to set Bearer token
- Protected routes will use this token automatically

✅ **Schema Validation**
- See required fields for each request
- View response schemas with examples
- Understand error responses

## How to Use

1. **Open Swagger UI**
   ```
   http://localhost:5000/api-docs
   ```

2. **Sign Up First**
   - Click on "Authentication" section
   - Expand "POST /api/auth/signup"
   - Click "Try it out"
   - Fill in the form
   - Click "Execute"

3. **Copy the JWT Token**
   - From the response, copy the token
   - Click "Authorize" button at top right
   - Paste: `Bearer {token}`
   - Click "Authorize"

4. **Access Protected Routes**
   - Now you can test any protected endpoint
   - The token will be sent automatically

5. **Test Endpoints**
   - Expand any endpoint
   - Click "Try it out"
   - Modify parameters if needed
   - Click "Execute"
   - See the response

## Example Workflows

### Complete Sign-Up and User Creation Flow

1. **Sign Up** (POST /api/auth/signup)
   ```json
   {
     "tenantName": "My Law Firm",
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@lawfirm.com",
     "password": "SecurePass123"
   }
   ```
   ➜ Get JWT token

2. **Authorize with Token**
   - Copy token from response
   - Click Authorize button
   - Paste: `Bearer {token}`

3. **Create New User** (POST /api/users/users)
   ```json
   {
     "firstName": "Jane",
     "lastName": "Smith",
     "email": "jane@lawfirm.com",
     "role": "ADVOCATE"
   }
   ```

4. **List All Users** (GET /api/users/users)
   - No body needed
   - Click Execute
   - See all users in tenant

### Multi-Tenant Data Isolation

Each user only sees data from their own tenant:

- Tenant A user cannot see Tenant B's users
- Tenant A user cannot access Tenant B's cases
- Requests are automatically filtered by tenantId

## API Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "details": []
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## Authentication

All protected endpoints require:

```
Authorization: Bearer {JWT_TOKEN}
```

The JWT token contains:
- `userId`: The user's ID
- `tenantId`: The tenant's ID
- `role`: User's role (OWNER, ADMIN, ADVOCATE, STAFF, CLIENT)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

## Roles & Permissions

| Role | Permissions |
|------|------------|
| **OWNER** | Full access to all endpoints |
| **ADMIN** | Can manage users and tenant settings |
| **ADVOCATE** | Can manage cases and documents |
| **STAFF** | Can assist with cases |
| **CLIENT** | Read-only access to their cases |

## Rate Limiting

Currently no rate limiting is applied. In production, implement:
- 100 requests per minute for public endpoints
- 1000 requests per minute for authenticated endpoints

## CORS

API accepts requests from:
- `http://localhost:3000` (development)
- `https://yourdomain.com` (production)

Configure `CORS_ORIGIN` in `.env` file.

## Testing Tips

### 1. Test Sign-Up
- Create new tenant + user
- Should return JWT token
- Token expires in 7 days

### 2. Test Login
- Use credentials from sign-up
- Get new JWT token
- Each login updates lastLogin timestamp

### 3. Test User Management
- Create users with different roles
- Update user details
- List users in tenant
- Delete users (soft delete)

### 4. Test Tenant Management
- Update tenant name and settings
- View subscription info
- Check timezone settings

### 5. Test Authorization
- Login as OWNER
- Try creating user (should work)
- Login as ADVOCATE
- Try creating user (should fail with 403)

## Troubleshooting

### "No token provided" Error
- Make sure you've authorized with the Bearer token
- Click Authorize button and paste token
- Format: `Bearer {token}`

### "Insufficient permissions" Error
- You don't have the required role
- Sign up as OWNER role for full access
- Other roles have limited permissions

### "User not found" Error
- Check the userId parameter
- Make sure user belongs to your tenant
- Try listing all users first

### "Email already exists" Error
- Email must be unique per tenant
- Use different email for new user
- Each tenant can have users with different emails

## API Documentation Download

You can download the OpenAPI specification at:
```
http://localhost:5000/api-docs/swagger.json
```

Use this JSON to:
- Generate client SDK
- Import into Postman
- Generate server stubs
- Share with team

## Next Steps

1. ✅ Test all endpoints in Swagger UI
2. ✅ Understand error responses
3. ✅ Build frontend client
4. ✅ Integrate authentication
5. ✅ Deploy to production

---

**API is ready for testing!** 🚀
