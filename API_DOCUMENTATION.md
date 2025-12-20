# Advocate Pro API Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users](#users-endpoints)
   - [Tenants](#tenants-endpoints)
   - [Clients](#clients-endpoints)
   - [Cases](#cases-endpoints)
   - [Hearings](#hearings-endpoints)
   - [Diaries](#diaries-endpoints)
   - [Case Timeline](#case-timeline-endpoints)
   - [Documents](#documents-endpoints)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Pagination](#pagination)
8. [Filtering & Search](#filtering--search)

---

## Introduction

**Advocate Pro** is a comprehensive legal practice management platform designed for law firms and advocates. This API documentation covers all endpoints available in the backend service.

### Base URL
```
http://localhost:5000/api
https://api.advocate-pro.com/api (Production)
```

### API Version
- Current Version: **v1**
- Last Updated: December 2024
- Total Endpoints: **62** (Authentication, Users, Tenants, Clients, Cases, Hearings, Daily Diaries, Case Notes, Confidential Entries, Court Hearing Diaries, Follow-ups, Client Meetings, Tasks, Expenses, Documents, Timeline)

### Prerequisites
- Node.js v14 or higher
- MongoDB Atlas or local MongoDB instance
- Valid JWT token for authenticated endpoints

---

## Authentication

### JWT Token
All protected endpoints require a Bearer token in the Authorization header.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure
The JWT token contains the following claims:

```json
{
  "userId": "user_id_here",
  "tenantId": "tenant_id_here",
  "role": "OWNER|ADMIN|ADVOCATE|STAFF|CLIENT",
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704672000
}
```

### Token Expiration
- **Expiration Time**: 7 days
- **Refresh Strategy**: User must login again to get new token

### Security Headers
All requests should include:
```http
Content-Type: application/json
Authorization: Bearer {token}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Sign Up (Create Tenant & First User)
Create a new Advocate Pro account with tenant and OWNER user.

```http
POST /auth/signup
Content-Type: application/json

{
  "tenantName": "Smith & Associates Law Firm",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@lawfirm.com",
  "password": "SecurePass123@"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "tenant": {
      "id": "tenant_123",
      "name": "Smith & Associates Law Firm",
      "slug": "smith-associates",
      "subscription": "starter",
      "createdAt": "2024-12-04T10:00:00Z"
    },
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@lawfirm.com",
      "role": "OWNER",
      "tenantId": "tenant_123"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid fields
- `409 Conflict` - Email already registered

---

#### 2. Login
Authenticate and receive JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@lawfirm.com",
  "password": "SecurePass123@"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tenant": {
      "id": "tenant_123",
      "name": "Smith & Associates Law Firm",
      "slug": "smith-associates"
    },
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@lawfirm.com",
      "role": "OWNER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password
- `403 Forbidden` - User account is inactive

---

#### 3. Get Current User Profile
Retrieve authenticated user's profile.

```http
GET /auth/me
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "tenant_123",
      "name": "Smith & Associates Law Firm"
    },
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@lawfirm.com",
      "role": "OWNER",
      "phone": "+1-2125551234",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No token provided or invalid token

---

### Users Endpoints

#### 4. Get All Users in Tenant
List all users with pagination.

```http
GET /users/users?page=1&limit=10&role=ADVOCATE&status=active
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `role` (optional): Filter by role (OWNER, ADMIN, ADVOCATE, STAFF, CLIENT)
- `status` (optional): Filter by status (active, inactive)
- `search` (optional): Search by name or email

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@lawfirm.com",
      "role": "OWNER",
      "phone": "+1-2125551234",
      "status": "active",
      "createdAt": "2024-12-04T10:00:00Z"
    },
    {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@lawfirm.com",
      "role": "ADVOCATE",
      "phone": "+1-2125551235",
      "status": "active",
      "createdAt": "2024-12-04T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

**Required Role:** OWNER, ADMIN

---

#### 5. Create New User
Add a new user to tenant.

```http
POST /users/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@lawfirm.com",
  "phone": "+1-2125551235",
  "role": "ADVOCATE",
  "password": "SecurePass456@",
  "specialization": "Corporate Law"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_456",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@lawfirm.com",
    "role": "ADVOCATE",
    "phone": "+1-2125551235",
    "tenantId": "tenant_123",
    "createdAt": "2024-12-04T11:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN

---

#### 6. Get User by ID
Retrieve specific user details.

```http
GET /users/users/{userId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@lawfirm.com",
    "role": "OWNER",
    "phone": "+1-2125551234",
    "specialization": "Constitutional Law",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 7. Update User
Update user information.

```http
PUT /users/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-2125551235",
  "specialization": "Corporate Law",
  "status": "active"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user_456",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@lawfirm.com",
    "role": "ADVOCATE",
    "phone": "+1-2125551235",
    "updatedAt": "2024-12-04T12:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN (or own profile)

---

#### 8. Delete User
Soft delete a user (sets status to inactive).

```http
DELETE /users/users/{userId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Required Role:** OWNER, ADMIN

---

### Tenants Endpoints

#### 9. Get Tenant Information
Retrieve current tenant details.

```http
GET /tenant/info
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "tenant_123",
    "name": "Smith & Associates Law Firm",
    "slug": "smith-associates",
    "subscription": "professional",
    "maxUsers": 50,
    "currentUsers": 12,
    "website": "https://smithlawfirm.com",
    "phone": "+1-2125551200",
    "address": "123 Law Street, New York, NY 10001",
    "timezone": "America/New_York",
    "language": "en",
    "logo": "https://example.com/logo.png",
    "features": ["clients", "cases", "hearings", "documents", "diaries"],
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 10. Update Tenant Information
Update tenant settings.

```http
PUT /tenant/info
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Smith & Associates - Updated",
  "website": "https://smithlawfirm.com",
  "phone": "+1-2125551200",
  "address": "123 Law Street, New York, NY 10001",
  "timezone": "America/New_York",
  "language": "en",
  "logo": "https://example.com/logo.png"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "tenant_123",
    "name": "Smith & Associates - Updated",
    "website": "https://smithlawfirm.com",
    "updatedAt": "2024-12-04T12:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN

---

#### 11. Get Tenant Usage Statistics
Retrieve tenant usage and limits.

```http
GET /tenant/stats
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "subscription": "professional",
    "users": {
      "current": 12,
      "limit": 50
    },
    "clients": {
      "current": 45,
      "limit": 500
    },
    "cases": {
      "current": 78,
      "limit": 1000
    },
    "storage": {
      "used": "2.5 GB",
      "limit": "100 GB"
    },
    "renewalDate": "2025-01-04"
  }
}
```

---

### Clients Endpoints

#### 12. Get All Clients
List all clients with filters and pagination.

```http
GET /clients?page=1&limit=10&status=active&category=individual&search=john
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `status` (optional): active, inactive, archived
- `category` (optional): individual, corporate, organization
- `search` (optional): Search by name, email, or phone

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "client_123",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+1-2125551234",
      "alternatePhone": "+1-2125551235",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "dateOfBirth": "1980-05-15",
      "aadharNumber": "1234-5678-9012",
      "panNumber": "ABCDE1234F",
      "category": "individual",
      "status": "active",
      "notes": "VIP client",
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 13. Get Client Statistics
Retrieve client overview statistics.

```http
GET /clients/stats/overview
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "totalClients": 45,
    "activeClients": 42,
    "inactiveClients": 3,
    "byCategory": {
      "individual": 40,
      "corporate": 4,
      "organization": 1
    },
    "newClientsThisMonth": 5,
    "clientsWithActiveCases": 38
  }
}
```

---

#### 14. Create Client
Add a new client.

```http
POST /clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "email": "rajesh@example.com",
  "phone": "+91-9876543210",
  "alternatePhone": "+91-8765432109",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "dateOfBirth": "1990-05-15",
  "aadharNumber": "1234-5678-9012",
  "panNumber": "ABCDE1234F",
  "category": "individual",
  "notes": "VIP client"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": "client_123",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh@example.com",
    "phone": "+91-9876543210",
    "category": "individual",
    "status": "active",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 15. Get Client by ID
Retrieve specific client details.

```http
GET /clients/{clientId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh@example.com",
    "phone": "+91-9876543210",
    "alternatePhone": "+91-8765432109",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "category": "individual",
    "status": "active",
    "notes": "VIP client",
    "activeCases": 3,
    "totalCases": 5,
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 16. Update Client
Update client information.

```http
PUT /clients/{clientId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "email": "rajesh.updated@example.com",
  "phone": "+91-9876543210",
  "status": "active",
  "notes": "Updated notes"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": "client_123",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh.updated@example.com",
    "updatedAt": "2024-12-04T12:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 17. Delete Client
Soft delete a client.

```http
DELETE /clients/{clientId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Required Role:** OWNER, ADMIN

---

### Cases Endpoints

#### 18. Get All Cases
List all cases with filters and pagination.

```http
GET /cases?page=1&limit=10&status=open&caseType=civil&clientId=client_123&search=smith
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `status` (optional): open, in_progress, closed, on_hold, archived
- `caseType` (optional): civil, criminal, family, corporate, property, labor, tax, intellectual_property, other
- `clientId` (optional): Filter by client
- `search` (optional): Search by title, case number, or opposite party

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "case_123",
      "caseNumber": "CIVIL-2024-001",
      "title": "Smith v. Johnson - Contract Dispute",
      "clientId": {
        "id": "client_123",
        "firstName": "John",
        "lastName": "Smith"
      },
      "caseType": "civil",
      "status": "in_progress",
      "court": {
        "name": "Delhi High Court",
        "location": "New Delhi",
        "jurisdiction": "Delhi"
      },
      "judge": "Justice Sharma",
      "oppositeParty": "XYZ Corporation",
      "filingDate": "2024-01-15",
      "nextHearingDate": "2024-02-20",
      "budget": 50000,
      "spentAmount": 15000,
      "priority": "high",
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 78,
    "page": 1,
    "limit": 10,
    "pages": 8
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 19. Get Case Statistics
Retrieve case overview statistics.

```http
GET /cases/stats/overview
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "totalCases": 78,
    "byStatus": {
      "open": 25,
      "in_progress": 35,
      "closed": 15,
      "on_hold": 3
    },
    "byType": {
      "civil": 45,
      "criminal": 18,
      "family": 8,
      "corporate": 5,
      "property": 2
    },
    "upcomingHearings": 12,
    "byPriority": {
      "high": 20,
      "medium": 35,
      "low": 23
    }
  }
}
```

---

#### 20. Create Case
Add a new case.

```http
POST /cases
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "client_123",
  "caseNumber": "CIVIL-2024-001",
  "title": "Smith v. Johnson - Contract Dispute",
  "description": "Breach of contract case regarding services",
  "caseType": "civil",
  "status": "open",
  "court": {
    "name": "Delhi High Court",
    "location": "New Delhi",
    "jurisdiction": "Delhi"
  },
  "judge": "Justice Sharma",
  "oppositeParty": "XYZ Corporation",
  "oppositeAdvocate": "Advocate Patel",
  "filingDate": "2024-01-15",
  "nextHearingDate": "2024-02-20",
  "budget": 50000,
  "priority": "high",
  "assignedTo": "user_123",
  "tags": ["contract", "commercial"],
  "notes": "Important case for firm"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Case created successfully",
  "data": {
    "id": "case_123",
    "caseNumber": "CIVIL-2024-001",
    "title": "Smith v. Johnson - Contract Dispute",
    "caseType": "civil",
    "status": "open",
    "clientId": "client_123",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 21. Get Case by ID
Retrieve specific case details.

```http
GET /cases/{caseId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "case_123",
    "caseNumber": "CIVIL-2024-001",
    "title": "Smith v. Johnson - Contract Dispute",
    "description": "Breach of contract case regarding services",
    "clientId": {
      "id": "client_123",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+1-2125551234"
    },
    "caseType": "civil",
    "status": "in_progress",
    "court": {
      "name": "Delhi High Court",
      "location": "New Delhi",
      "jurisdiction": "Delhi"
    },
    "judge": "Justice Sharma",
    "oppositeParty": "XYZ Corporation",
    "oppositeAdvocate": "Advocate Patel",
    "filingDate": "2024-01-15",
    "nextHearingDate": "2024-02-20",
    "budget": 50000,
    "spentAmount": 15000,
    "priority": "high",
    "assignedTo": {
      "id": "user_123",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "tags": ["contract", "commercial"],
    "totalHearings": 5,
    "upcomingHearings": 2,
    "documents": 12,
    "notes": "Important case for firm",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 22. Update Case
Update case information.

```http
PUT /cases/{caseId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "spentAmount": 15000,
  "nextHearingDate": "2024-02-20",
  "judge": "Justice Sharma",
  "notes": "Updated case status"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Case updated successfully",
  "data": {
    "id": "case_123",
    "caseNumber": "CIVIL-2024-001",
    "status": "in_progress",
    "spentAmount": 15000,
    "updatedAt": "2024-12-04T12:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 23. Delete Case
Soft delete a case.

```http
DELETE /cases/{caseId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Case deleted successfully"
}
```

**Required Role:** OWNER, ADMIN

---

### Hearings Endpoints

#### 24. Get Calendar View
Get hearings grouped by date for a month.

```http
GET /hearings/calendar?month=2&year=2024&caseId=optional_case_id
Authorization: Bearer {token}
```

**Query Parameters:**
- `month` (required): Month number (1-12)
- `year` (required): Year (e.g., 2024)
- `caseId` (optional): Filter by specific case

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "2024-02-15": [
      {
        "id": "hearing_123",
        "hearingDate": "2024-02-15",
        "hearingTime": "10:30 AM",
        "courtroom": "Court Room 5",
        "judge": "Justice Sharma",
        "caseId": {
          "id": "case_123",
          "caseNumber": "CIVIL-2024-001",
          "title": "Smith v. Johnson"
        },
        "status": "scheduled",
        "reminderSent": false
      }
    ],
    "2024-02-20": [...]
  },
  "total": 5
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 25. Get Upcoming Hearings
Get list of hearings for next N days.

```http
GET /hearings/upcoming/list?days=7&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `days` (optional): Number of days ahead (default: 7)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "hearing_123",
      "hearingDate": "2024-12-05",
      "hearingTime": "10:30 AM",
      "courtroom": "Court Room 5",
      "judge": "Justice Sharma",
      "caseId": {
        "id": "case_123",
        "caseNumber": "CIVIL-2024-001",
        "title": "Smith v. Johnson",
        "clientId": {
          "firstName": "John",
          "lastName": "Smith"
        }
      },
      "status": "scheduled",
      "reminderSent": false,
      "reminderMethod": "both",
      "description": "Arguments on jurisdiction"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

#### 26. Create Hearing
Add a new hearing.

```http
POST /hearings
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "hearingDate": "2024-02-20",
  "hearingTime": "2:00 PM",
  "courtroom": "Court Room 5",
  "judge": "Justice Sharma",
  "description": "Arguments on jurisdiction",
  "reminderMethod": "both",
  "status": "scheduled",
  "notes": "Important hearing"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Hearing created successfully",
  "data": {
    "id": "hearing_123",
    "hearingDate": "2024-02-20",
    "hearingTime": "2:00 PM",
    "courtroom": "Court Room 5",
    "judge": "Justice Sharma",
    "caseId": "case_123",
    "status": "scheduled",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 27. Get Hearing by ID
Retrieve specific hearing details.

```http
GET /hearings/{hearingId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "hearing_123",
    "hearingDate": "2024-02-20",
    "hearingTime": "2:00 PM",
    "courtroom": "Court Room 5",
    "judge": "Justice Sharma",
    "caseId": {
      "id": "case_123",
      "caseNumber": "CIVIL-2024-001",
      "title": "Smith v. Johnson"
    },
    "status": "scheduled",
    "description": "Arguments on jurisdiction",
    "reminderSent": false,
    "reminderMethod": "both",
    "outcome": null,
    "nextHearingDate": null,
    "notes": "Important hearing",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 28. Update Hearing
Update hearing information.

```http
PUT /hearings/{hearingId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "outcome": "Court ordered mediation",
  "hearingTime": "2:00 PM"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Hearing updated successfully",
  "data": {
    "id": "hearing_123",
    "status": "completed",
    "outcome": "Court ordered mediation",
    "updatedAt": "2024-12-04T12:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 29. Delete Hearing
Delete a hearing.

```http
DELETE /hearings/{hearingId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Hearing deleted successfully"
}
```

**Required Role:** OWNER, ADMIN

---

#### 30. Get Hearings by Case
Get all hearings for a specific case.

```http
GET /hearings/case/{caseId}?page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "hearing_123",
      "hearingDate": "2024-02-20",
      "hearingTime": "2:00 PM",
      "courtroom": "Court Room 5",
      "judge": "Justice Sharma",
      "status": "scheduled",
      "description": "Arguments on jurisdiction"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### Documents Endpoints

#### 31. Get All Documents
List all documents with pagination.

```http
GET /documents?page=1&limit=10&caseId=case_123&type=pdf&search=contract
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `caseId` (optional): Filter by case
- `type` (optional): pdf, doc, docx, jpg, png, etc.
- `search` (optional): Search by document name

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "name": "contract_agreement.pdf",
      "type": "pdf",
      "size": "2.5 MB",
      "caseId": "case_123",
      "uploadedBy": {
        "id": "user_123",
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "uploadedAt": "2024-12-04T10:00:00Z",
      "url": "https://example.com/documents/doc_123.pdf"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 32. Upload Document
Upload a document.

```http
POST /documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: (binary file)
- caseId: case_123
- name: Contract Agreement
- type: pdf
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc_123",
    "name": "contract_agreement.pdf",
    "type": "pdf",
    "size": "2.5 MB",
    "caseId": "case_123",
    "url": "https://example.com/documents/doc_123.pdf",
    "uploadedAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 33. Delete Document
Delete a document.

```http
DELETE /documents/{documentId}
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE (uploader)

---

### Diaries Endpoints

Advocate Pro provides multiple specialized diary types for comprehensive case documentation:

#### 34. Get Daily Diary Entries
Get personal daily diary entries for a specific date.

```http
GET /api/diaries/daily/:date?page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "diary_123",
    "date": "2024-12-04",
    "userId": "user_123",
    "hearings": [
      {
        "hearingId": "hearing_123",
        "time": "10:30 AM",
        "caseNumber": "CIVIL-2024-001"
      }
    ],
    "clientMeetings": [
      {
        "meetingId": "meeting_123",
        "clientName": "John Smith",
        "time": "2:00 PM"
      }
    ],
    "followUps": [],
    "tasks": [],
    "alerts": [],
    "notes": "Today was productive - good court hearing outcome",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 35. Create or Update Daily Diary Entry
Create or update daily diary for user.

```http
POST /api/diaries/daily
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-12-04",
  "notes": "Productive day with successful case hearing",
  "mood": "positive",
  "workloadStatus": "moderate"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Diary entry created successfully",
  "data": {
    "id": "diary_123",
    "date": "2024-12-04",
    "userId": "user_123",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 36. Get Daily Diary Range
Get daily diaries for a date range.

```http
GET /api/diaries/daily/range/list?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-04",
      "notes": "Productive day",
      "mood": "positive"
    }
  ],
  "totalDays": 30
}
```

---

#### 37. Get Case Notes Diary
Get case-specific notes and observations.

```http
GET /api/diaries/case-notes/:id?page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Records per page
- `search` (optional): Search notes by keyword

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "note_123",
      "caseId": "case_123",
      "title": "Initial Client Consultation",
      "content": "Client revealed new evidence regarding timeline",
      "noteType": "observation",
      "importance": "high",
      "attachments": [],
      "createdBy": {
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

#### 38. Create Case Notes Entry
Create case-specific notes.

```http
POST /api/diaries/case-notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "title": "Initial Client Consultation",
  "content": "Client revealed new evidence regarding timeline",
  "noteType": "observation",
  "importance": "high"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Case note created successfully",
  "data": {
    "id": "note_123",
    "caseId": "case_123",
    "title": "Initial Client Consultation",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

**Required Role:** OWNER, ADMIN, ADVOCATE

---

#### 39. Search Case Notes
Search case notes across all cases.

```http
GET /api/diaries/case-notes/search?q=settlement&caseId=case_123
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "note_123",
      "caseId": "case_123",
      "title": "Settlement Discussion",
      "content": "..."
    }
  ]
}
```

---

#### 40. Get Confidential Lawyer Diary
Get confidential entries (owner-only access).

```http
GET /api/diaries/confidential
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "conf_123",
      "title": "Confidential Strategy Notes",
      "content": "Internal analysis and strategy...",
      "accessLog": [
        {
          "userId": "user_123",
          "accessedAt": "2024-12-04T10:00:00Z"
        }
      ],
      "sharedWith": [
        {
          "userId": "user_456",
          "name": "John Smith",
          "sharedAt": "2024-12-03T10:00:00Z"
        }
      ],
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ]
}
```

---

#### 41. Create Confidential Entry
Create a confidential diary entry.

```http
POST /api/diaries/confidential
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Confidential Strategy Notes",
  "content": "Internal analysis and strategy...",
  "tags": ["strategy", "internal"]
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Confidential entry created successfully",
  "data": {
    "id": "conf_123",
    "title": "Confidential Strategy Notes",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 42. Share Confidential Entry
Share confidential entry with another advocate.

```http
POST /api/diaries/confidential/:id/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_456",
  "accessLevel": "view"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Entry shared successfully",
  "data": {
    "shareId": "share_123",
    "sharedWith": "John Smith",
    "accessLevel": "view"
  }
}
```

---

#### 43. Get Court Hearing Diary
Get court hearing notes and outcomes.

```http
GET /api/diaries/court-hearing/:caseId?page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "hearing_diary_123",
      "hearingId": "hearing_123",
      "caseId": "case_123",
      "hearingDate": "2024-02-20",
      "judge": "Justice Sharma",
      "observations": "Judge seemed favorable to our arguments",
      "outcome": "Court ordered mediation",
      "nextSteps": "Schedule mediation session",
      "createdBy": "user_123",
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

#### 44. Create Court Hearing Diary Entry
Create court hearing notes.

```http
POST /api/diaries/court-hearing
Authorization: Bearer {token}
Content-Type: application/json

{
  "hearingId": "hearing_123",
  "caseId": "case_123",
  "observations": "Judge seemed favorable to our arguments",
  "outcome": "Court ordered mediation",
  "nextSteps": "Schedule mediation session"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Court hearing diary created successfully",
  "data": {
    "id": "hearing_diary_123",
    "hearingId": "hearing_123",
    "outcome": "Court ordered mediation",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 45. Get Follow-up Diary
Get follow-up tasks and reminders.

```http
GET /api/diaries/follow-up?status=pending&priority=high&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): pending, completed, overdue
- `priority` (optional): high, medium, low
- `page` (optional): Page number
- `limit` (optional): Records per page

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "followup_123",
      "caseId": "case_123",
      "title": "Call Client - Case Update",
      "description": "Provide update on case progress",
      "dueDate": "2024-12-10",
      "priority": "high",
      "status": "pending",
      "assignedTo": "user_123",
      "attempts": [],
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

#### 46. Create Follow-up Entry
Create a follow-up task.

```http
POST /api/diaries/follow-up
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "title": "Call Client - Case Update",
  "description": "Provide update on case progress",
  "dueDate": "2024-12-10",
  "priority": "high",
  "reminderDate": "2024-12-09"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Follow-up created successfully",
  "data": {
    "id": "followup_123",
    "title": "Call Client - Case Update",
    "dueDate": "2024-12-10",
    "status": "pending",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 47. Get Overdue Follow-ups
Get all overdue follow-up tasks.

```http
GET /api/diaries/follow-up/overdue/list?page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "followup_456",
      "caseId": "case_456",
      "title": "Review Legal Documents",
      "dueDate": "2024-12-01",
      "daysOverdue": 3,
      "priority": "high",
      "status": "pending"
    }
  ],
  "overdueCount": 5
}
```

---

#### 48. Get Personal Client Meeting Diary
Get client meeting notes and follow-ups.

```http
GET /api/diaries/meetings?clientId=client_123&page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "meeting_123",
      "clientId": "client_123",
      "clientName": "John Smith",
      "meetingDate": "2024-12-04",
      "meetingTime": "2:00 PM",
      "location": "Law Firm Office",
      "topic": "Case Strategy Discussion",
      "notes": "Discussed settlement options",
      "voiceNotes": [],
      "followUpRequired": true,
      "followUpDate": "2024-12-11",
      "createdBy": "user_123",
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

#### 49. Create Client Meeting Entry
Create client meeting notes.

```http
POST /api/diaries/meetings
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "client_123",
  "meetingDate": "2024-12-04",
  "meetingTime": "2:00 PM",
  "location": "Law Firm Office",
  "topic": "Case Strategy Discussion",
  "notes": "Discussed settlement options",
  "followUpRequired": true,
  "followUpDate": "2024-12-11"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Meeting entry created successfully",
  "data": {
    "id": "meeting_123",
    "clientId": "client_123",
    "clientName": "John Smith",
    "meetingDate": "2024-12-04",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 50. Get Today's Meetings
Get all meetings scheduled for today.

```http
GET /api/diaries/meetings/today/list
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "meeting_123",
      "clientName": "John Smith",
      "meetingTime": "2:00 PM",
      "location": "Law Firm Office",
      "topic": "Case Strategy Discussion"
    }
  ],
  "totalToday": 3
}
```

---

#### 51. Get Task/To-Do Diary
Get tasks and assignments.

```http
GET /api/diaries/tasks?status=pending&assignedTo=me&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): pending, in_progress, completed, rejected
- `assignedTo` (optional): me, user_id
- `priority` (optional): high, medium, low

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_123",
      "title": "Draft Legal Brief",
      "description": "Prepare legal brief for CIVIL-2024-001",
      "status": "pending",
      "priority": "high",
      "dueDate": "2024-12-10",
      "assignedTo": {
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "createdBy": "user_123",
      "subtasks": [
        {
          "id": "subtask_1",
          "title": "Research case law",
          "status": "completed"
        }
      ],
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 18,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

#### 52. Create Task Entry
Create a new task/assignment.

```http
POST /api/diaries/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Draft Legal Brief",
  "description": "Prepare legal brief for CIVIL-2024-001",
  "assignedTo": "user_456",
  "priority": "high",
  "dueDate": "2024-12-10",
  "subtasks": [
    {
      "title": "Research case law",
      "description": "Find relevant precedents"
    }
  ]
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "task_123",
    "title": "Draft Legal Brief",
    "assignedTo": "user_456",
    "dueDate": "2024-12-10",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 53. Get My Tasks
Get all tasks assigned to current user.

```http
GET /api/diaries/tasks/assigned/me?page=1&limit=10
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_123",
      "title": "Draft Legal Brief",
      "status": "pending",
      "priority": "high",
      "dueDate": "2024-12-10",
      "daysUntilDue": 6
    }
  ],
  "totalAssigned": 8
}
```

---

#### 54. Get Expense Diary
Track case-related expenses.

```http
GET /api/diaries/expenses?caseId=case_123&month=12&year=2024&page=1&limit=20
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "expense_123",
      "caseId": "case_123",
      "description": "Court filing fees",
      "amount": 5000,
      "category": "filing_fee",
      "date": "2024-12-04",
      "verified": false,
      "createdBy": "user_123"
    }
  ],
  "summary": {
    "totalExpenses": 15000,
    "byCategory": {
      "filing_fee": 5000,
      "travel": 3000,
      "expert_fees": 4000,
      "other": 3000
    },
    "budgetRemaining": 35000
  }
}
```

---

#### 55. Create Expense Entry
Log a case expense.

```http
POST /api/diaries/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "description": "Court filing fees",
  "amount": 5000,
  "category": "filing_fee",
  "date": "2024-12-04",
  "receipt": "file_url_here"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Expense recorded successfully",
  "data": {
    "id": "expense_123",
    "caseId": "case_123",
    "amount": 5000,
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 56. Get Document Diary
Track document requirements and status for a case.

```http
GET /api/diaries/documents/case/:caseId
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "caseId": "case_123",
    "documentChecklist": [
      {
        "id": "doc_req_123",
        "name": "Power of Attorney",
        "status": "received",
        "receivedDate": "2024-12-01",
        "uploadedFile": "file_url"
      },
      {
        "id": "doc_req_124",
        "name": "Income Certificate",
        "status": "pending",
        "dueDate": "2024-12-10",
        "reminderSent": true
      }
    ],
    "completionPercentage": 60
  }
}
```

---

#### 57. Create Document Reminder
Send reminder to client for pending documents.

```http
POST /api/diaries/documents/case/:caseId/send-reminder
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentIds": ["doc_req_124", "doc_req_125"],
  "message": "Please submit pending documents at your earliest convenience"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Reminders sent successfully",
  "data": {
    "remindersSent": 2,
    "sentAt": "2024-12-04T10:00:00Z"
  }
}
```

---

## Case Timeline Endpoints

#### 58. Get Case Timeline
Get chronological timeline of case events.

```http
GET /api/timeline/:caseId
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "timeline_123",
      "caseId": "case_123",
      "event": "Case Filed",
      "date": "2024-01-15",
      "description": "Contract dispute case filed in Delhi High Court",
      "eventType": "filing",
      "importance": "high",
      "createdBy": "user_123"
    },
    {
      "id": "timeline_124",
      "caseId": "case_123",
      "event": "First Hearing",
      "date": "2024-02-20",
      "description": "Initial hearing on jurisdictional issues",
      "eventType": "hearing",
      "importance": "high"
    }
  ]
}
```

---

#### 59. Add Timeline Event
Add an event to case timeline.

```http
POST /api/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "event": "Settlement Negotiation",
  "date": "2024-12-04",
  "description": "Initial settlement discussions with opposite counsel",
  "eventType": "negotiation",
  "importance": "medium"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Timeline event created successfully",
  "data": {
    "id": "timeline_125",
    "caseId": "case_123",
    "event": "Settlement Negotiation",
    "date": "2024-12-04",
    "createdAt": "2024-12-04T10:00:00Z"
  }
}
```

---

### Documents Endpoints

#### 60. Get All Documents
List all documents with pagination and filters.

```http
GET /api/documents?page=1&limit=10&caseId=case_123&type=pdf&search=contract
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Records per page
- `caseId` (optional): Filter by case
- `type` (optional): pdf, doc, docx, jpg, png
- `search` (optional): Search by document name

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "name": "contract_agreement.pdf",
      "type": "pdf",
      "size": "2.5 MB",
      "caseId": "case_123",
      "uploadedBy": {
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "uploadedAt": "2024-12-04T10:00:00Z",
      "url": "https://example.com/documents/doc_123.pdf"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

#### 61. Upload Document
Upload a document to a case.

```http
POST /api/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: (binary file)
- caseId: case_123
- name: Contract Agreement
- type: pdf
- category: legal_documents
```

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc_123",
    "name": "contract_agreement.pdf",
    "type": "pdf",
    "size": "2.5 MB",
    "caseId": "case_123",
    "url": "https://example.com/documents/doc_123.pdf",
    "uploadedAt": "2024-12-04T10:00:00Z"
  }
}
```

---

#### 62. Delete Document
Delete a document.

```http
DELETE /api/documents/:documentId
Authorization: Bearer {token}
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---



All API responses follow a consistent format:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "pagination": { /* optional */ }
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error message describing the issue",
  "error": "ErrorCode",
  "details": { /* optional additional info */ }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content returned |
| 400 | Bad Request | Invalid input or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the resource |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Responses

**401 Unauthorized - Missing Token**
```json
{
  "success": false,
  "message": "No authentication token provided",
  "error": "AUTH_TOKEN_MISSING"
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "AUTH_TOKEN_INVALID"
}
```

**403 Forbidden - Insufficient Permissions**
```json
{
  "success": false,
  "message": "Insufficient permissions to access this resource",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "RESOURCE_NOT_FOUND"
}
```

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "firstName": "First name is required",
    "email": "Invalid email format"
  }
}
```

---

## Rate Limiting

API rate limiting is implemented to prevent abuse:

- **Standard Tier**: 100 requests per minute
- **Professional Tier**: 500 requests per minute
- **Enterprise Tier**: Unlimited requests

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067260
```

When rate limit exceeded:
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Pagination

Paginated endpoints return results in chunks. Use `page` and `limit` parameters:

```http
GET /clients?page=1&limit=10
```

**Pagination Metadata:**
```json
{
  "pagination": {
    "total": 450,
    "page": 1,
    "limit": 10,
    "pages": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Default Values:**
- Page: 1
- Limit: 10
- Max Limit: 100

---

## Filtering & Search

### Search
Search across multiple fields:
```http
GET /clients?search=john+smith
GET /cases?search=contract+dispute
GET /documents?search=agreement
```

### Filtering
Filter by specific attributes:
```http
GET /cases?status=open&caseType=civil&priority=high
GET /clients?category=individual&status=active
GET /hearings?status=scheduled
```

### Sorting
Sort results (default: createdAt DESC):
```http
GET /clients?sort=-createdAt
GET /cases?sort=nextHearingDate
```

Sort ascending: `fieldName`
Sort descending: `-fieldName`

---

## Webhooks (Future)

Webhook support coming soon for:
- New hearing scheduled
- Case status changed
- Document uploaded
- Follow-up due
- Reminder sent

---

## Testing API Endpoints

### Using cURL

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Smith Law Firm",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@lawfirm.com",
    "password": "SecurePass123@"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@lawfirm.com",
    "password": "SecurePass123@"
  }'

# Get current user (replace {token} with actual token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {token}"

# Create client
curl -X POST http://localhost:5000/api/clients \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "phone": "+91-9876543210",
    "category": "individual"
  }'

# Get all cases
curl http://localhost:5000/api/cases \
  -H "Authorization: Bearer {token}"

# Create case
curl -X POST http://localhost:5000/api/cases \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_id",
    "caseNumber": "CIVIL-2024-001",
    "title": "Smith v. Johnson",
    "caseType": "civil"
  }'
```

### Using Postman

1. Import the API collection (available in `API_EXAMPLES.rest`)
2. Create environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: Your JWT token from login
   - `tenant_id`: Your tenant ID
3. Use pre-request scripts to automatically include token in headers
4. Create variables for commonly used IDs (clientId, caseId, etc.)

---

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:5000/api-docs
```

Includes:
- Live API testing
- Request/response examples
- Parameter descriptions
- Authentication setup
- Response schema definitions

---

## Best Practices

### Authentication
- Store JWT securely (httpOnly cookies preferred)
- Include token in Authorization header: `Bearer {token}`
- Handle token expiration gracefully
- Implement token refresh mechanism

### Requests
- Always validate input before sending
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Include Content-Type header for requests with body
- Use query parameters for filtering, not request body

### Error Handling
- Check `success` field in response
- Log full error response for debugging
- Implement exponential backoff for retries
- Handle rate limiting gracefully

### Performance
- Use pagination for large datasets
- Filter and search server-side when possible
- Cache frequently accessed data
- Batch operations when allowed

---

## SDK & Libraries

Official SDKs available for:
- **JavaScript/Node.js**: `@advocate-pro/js-sdk`
- **Python**: `advocate-pro-python`
- **Java**: `advocate-pro-java`
- **Go**: `advocate-pro-go`

Installation:
```bash
npm install @advocate-pro/js-sdk
```

---

## Support & Resources

- **Documentation**: https://docs.advocate-pro.com
- **Status Page**: https://status.advocate-pro.com
- **Support Email**: support@advocate-pro.com
- **GitHub Issues**: https://github.com/advocate-pro/backend/issues
- **Community Forum**: https://forum.advocate-pro.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial release with core features |
| 0.9.0 | Nov 2024 | Beta version with limited features |

---

**Last Updated:** December 4, 2024
**Maintained By:** Advocate Pro Development Team
