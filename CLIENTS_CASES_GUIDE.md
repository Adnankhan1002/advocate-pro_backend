# Clients & Cases Management

## Overview

The Advocate Pro platform now includes comprehensive client and case management features with hearing calendar integration and automated reminders.

## Models

### Client Model
```javascript
{
  tenantId,           // Reference to tenant
  firstName,
  lastName,
  email,              // Unique per tenant
  phone,              // Required
  alternatePhone,
  address: {
    street,
    city,
    state,
    zipCode,
    country
  },
  dateOfBirth,
  aadharNumber,       // India-specific
  panNumber,          // India-specific
  category,           // individual, corporate, organization
  status,             // active, inactive, archived
  notes,
  customFields,       // For tenant-specific data
  createdBy,          // User reference
  createdAt,
  updatedAt
}
```

### Case Model
```javascript
{
  tenantId,           // Reference to tenant
  caseNumber,         // Unique per tenant
  clientId,           // Reference to client
  title,
  description,
  caseType,           // civil, criminal, family, corporate, property, labor, tax, intellectual_property, other
  status,             // open, in_progress, closed, on_hold, archived
  court: {
    name,
    location,
    jurisdiction
  },
  judge,
  oppositeParty,
  oppositeAdvocate,
  filingDate,
  nextHearingDate,
  budget,
  spentAmount,
  priority,           // low, medium, high, urgent
  assignedTo,         // User reference
  tags,               // Array of tags
  documents: [{
    name,
    url,
    type,
    uploadedAt
  }],
  notes,
  createdBy,          // User reference
  createdAt,
  updatedAt
}
```

### Hearing Model
```javascript
{
  tenantId,           // Reference to tenant
  caseId,             // Reference to case
  hearingDate,        // Indexed for calendar queries
  hearingTime,        // e.g., "10:30 AM"
  courtroom,
  judge,
  description,
  reminderSent,       // Boolean
  reminderSentAt,     // DateTime
  reminderMethod,     // email, sms, both, none
  status,             // scheduled, postponed, completed, cancelled
  outcome,
  nextHearingDate,    // For postponed hearings
  notes,
  attachments,
  createdBy,          // User reference
  createdAt,
  updatedAt
}
```

## API Endpoints

### Clients

#### Get All Clients
```http
GET /api/clients
Authorization: Bearer {token}

Query Parameters:
- status: active|inactive|archived
- category: individual|corporate|organization
- search: Search by name, email, phone
- page: Page number (default: 1)
- limit: Records per page (default: 10)

Response: 200
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Get Client Statistics
```http
GET /api/clients/stats/overview
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "totalClients": 50,
    "activeClients": 45,
    "byCategory": {
      "individual": 40,
      "corporate": 5,
      "organization": 5
    }
  }
}
```

#### Create Client
```http
POST /api/clients
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

Response: 201
{
  "success": true,
  "message": "Client created successfully",
  "data": {...}
}
```

#### Get Client by ID
```http
GET /api/clients/{clientId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {...}
}
```

#### Update Client
```http
PUT /api/clients/{clientId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  ...
}

Response: 200
{
  "success": true,
  "message": "Client updated successfully",
  "data": {...}
}
```

#### Delete Client (Soft Delete)
```http
DELETE /api/clients/{clientId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

### Cases

#### Get All Cases
```http
GET /api/cases
Authorization: Bearer {token}

Query Parameters:
- status: open|in_progress|closed|on_hold|archived
- caseType: civil|criminal|family|corporate|property|labor|tax|intellectual_property|other
- clientId: Filter by client
- search: Search by title, case number, opposite party
- page: Page number (default: 1)
- limit: Records per page (default: 10)

Response: 200
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "caseNumber": "CIVIL-2024-001",
      "title": "Contract Dispute",
      "caseType": "civil",
      "status": "in_progress",
      "clientId": {...},
      "assignedTo": {...},
      ...
    }
  ],
  "pagination": {...}
}
```

#### Get Case Statistics
```http
GET /api/cases/stats/overview
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "totalCases": 25,
    "byStatus": {
      "open": 10,
      "in_progress": 12,
      "closed": 3
    },
    "byType": {
      "civil": 15,
      "criminal": 8,
      "family": 2
    },
    "upcomingHearings": 5
  }
}
```

#### Create Case
```http
POST /api/cases
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "client_id",
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
  "assignedTo": "advocate_user_id",
  "tags": ["contract", "commercial"],
  "notes": "Important case for firm"
}

Response: 201
{
  "success": true,
  "message": "Case created successfully",
  "data": {...}
}
```

#### Get Case by ID
```http
GET /api/cases/{caseId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {...}
}
```

#### Update Case
```http
PUT /api/cases/{caseId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "spentAmount": 15000,
  "notes": "Updated case status"
}

Response: 200
{
  "success": true,
  "message": "Case updated successfully",
  "data": {...}
}
```

#### Delete Case (Soft Delete)
```http
DELETE /api/cases/{caseId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Case deleted successfully"
}
```

---

### Hearings & Calendar

#### Get Calendar View (by Month/Year)
```http
GET /api/hearings/calendar?month=2&year=2024&caseId=optional_case_id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "2024-02-15": [
      {
        "_id": "...",
        "hearingDate": "2024-02-15",
        "hearingTime": "10:30 AM",
        "caseId": {...},
        "status": "scheduled"
      }
    ],
    "2024-02-20": [...]
  },
  "total": 5
}
```

#### Get Upcoming Hearings
```http
GET /api/hearings/upcoming/list?days=7&page=1&limit=10
Authorization: Bearer {token}

Query Parameters:
- days: Number of days to look ahead (default: 7)
- page: Page number
- limit: Records per page

Response: 200
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "hearingDate": "2024-02-20",
      "hearingTime": "2:00 PM",
      "courtroom": "Court Room 5",
      "judge": "Justice Sharma",
      "caseId": {
        "title": "Smith v. Johnson",
        "caseNumber": "CIVIL-2024-001",
        "clientId": {...}
      },
      "status": "scheduled",
      "reminderSent": false
    }
  ],
  "pagination": {...}
}
```

#### Create Hearing
```http
POST /api/hearings
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_id",
  "hearingDate": "2024-02-20",
  "hearingTime": "2:00 PM",
  "courtroom": "Court Room 5",
  "judge": "Justice Sharma",
  "description": "Arguments on jurisdiction",
  "reminderMethod": "both",  // email, sms, both, none
  "status": "scheduled",
  "notes": "Important hearing"
}

Response: 201
{
  "success": true,
  "message": "Hearing created successfully",
  "data": {...}
}
```

#### Get Hearing by ID
```http
GET /api/hearings/{hearingId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {...}
}
```

#### Update Hearing
```http
PUT /api/hearings/{hearingId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "outcome": "Court ordered mediation"
}

Response: 200
{
  "success": true,
  "message": "Hearing updated successfully",
  "data": {...}
}
```

#### Delete Hearing
```http
DELETE /api/hearings/{hearingId}
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Hearing deleted successfully"
}
```

#### Get Hearings by Case
```http
GET /api/hearings/case/{caseId}?page=1&limit=10
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

## Background Jobs & Reminders

### Hearing Reminder Job
**Schedule:** Daily at 8:00 AM

Automatically sends reminders for hearings scheduled tomorrow to the assigned advocate.

**Configuration:**
1. Email reminders (optional):
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_specific_password
   ```

2. SMS reminders via Twilio (optional):
   ```env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**How it works:**
1. Job runs daily at 8 AM
2. Finds all hearings scheduled for tomorrow
3. Checks `reminderMethod` preference (email, SMS, both)
4. Sends reminders to assigned advocate
5. Updates `reminderSent: true` and `reminderSentAt`

**Email Template includes:**
- Case title and number
- Client name and contact
- Hearing date and time
- Courtroom and judge
- Case description

---

## Frontend Pages Implementation Guide

### Clients List Page
```javascript
// GET /api/clients?page=1&limit=20
Components:
- Search bar (by name, email, phone)
- Filter by status and category
- Table with columns: Name, Phone, Email, Category, Status, Actions
- Add Client button → opens modal/new page
- Client actions: View, Edit, Delete
```

### Add/Edit Client Page
```javascript
// POST /api/clients or PUT /api/clients/{id}
Form Fields:
- First Name (required)
- Last Name (required)
- Email (optional)
- Phone (required)
- Alternate Phone
- Address (Street, City, State, ZIP, Country)
- Date of Birth
- Aadhar Number
- PAN Number
- Category (individual, corporate, organization)
- Notes (textarea)
- Save button
```

### Cases List Page
```javascript
// GET /api/cases?page=1&limit=20
Components:
- Search bar (by title, case number, opposite party)
- Filters: Status, Case Type, Client, Priority
- Table with columns: Case No, Title, Client, Status, Priority, Next Hearing, Actions
- Add Case button → opens form
- Case actions: View, Edit, Delete
```

### Add/Edit Case Page
```javascript
// POST /api/cases or PUT /api/cases/{id}
Form Fields:
- Case Number (unique per tenant)
- Client (dropdown - GET /api/clients)
- Title
- Description
- Case Type (dropdown)
- Status (dropdown)
- Court Name
- Court Location
- Judge Name
- Opposite Party
- Opposite Advocate
- Filing Date (date picker)
- Next Hearing Date (date picker)
- Budget (number)
- Priority (dropdown)
- Assigned To (dropdown - GET /api/users)
- Tags (multi-select)
- Notes (textarea)
- Save button
```

### Hearing Calendar Page
```javascript
// GET /api/hearings/calendar?month=2&year=2024
Components:
- Calendar view (month grid)
- Date cells show hearings
- Click date to see hearing details
- Add Hearing button → opens form
- Filter by case (optional)
- Navigation: Previous/Next Month
- Legend: Shows hearing count by status color
```

### Upcoming Hearings List Page
```javascript
// GET /api/hearings/upcoming/list?days=7
Components:
- List of hearings for next N days
- Each row shows: Case, Date, Time, Courtroom, Judge
- Sort by date (ascending)
- Quick actions: Mark Done, Reschedule, Send Reminder
- Color coding: Today (red), This week (orange), Next week (blue)
```

---

## Role-Based Access Control

| Route | OWNER | ADMIN | ADVOCATE | STAFF | CLIENT |
|-------|-------|-------|----------|-------|--------|
| GET /clients | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /clients | ✓ | ✓ | ✓ | ✗ | ✗ |
| PUT /clients | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE /clients | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /cases | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| POST /cases | ✓ | ✓ | ✓ | ✗ | ✗ |
| PUT /cases | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE /cases | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /hearings | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| POST /hearings | ✓ | ✓ | ✓ | ✗ | ✗ |
| PUT /hearings | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE /hearings | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Database Indexes

All models have optimized indexes for performance:

**Client:**
- `{ tenantId: 1, email: 1 }` - Compound for email uniqueness
- `{ tenantId: 1, phone: 1 }` - Phone lookups
- `{ tenantId: 1, status: 1 }` - Status filtering

**Case:**
- `{ tenantId: 1, caseNumber: 1 }` - Unique case numbers
- `{ tenantId: 1, status: 1 }` - Status filtering
- `{ tenantId: 1, clientId: 1 }` - Client cases
- `{ nextHearingDate: 1 }` - Hearing date sorting

**Hearing:**
- `{ tenantId: 1, hearingDate: 1 }` - Calendar queries
- `{ tenantId: 1, caseId: 1 }` - Case hearings
- `{ tenantId: 1, reminderSent: 1 }` - Reminder processing

---

## Testing the API

### Using cURL

```bash
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

# Get calendar for February 2024
curl "http://localhost:5000/api/hearings/calendar?month=2&year=2024" \
  -H "Authorization: Bearer {token}"

# Create hearing
curl -X POST http://localhost:5000/api/hearings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "...",
    "hearingDate": "2024-02-20",
    "hearingTime": "2:00 PM",
    "courtroom": "Court Room 5",
    "reminderMethod": "both"
  }'
```

---

## Next Steps

1. **Document Upload**: Add file upload to cases for PDFs/documents
2. **Case Notes**: Create rich text case notes/journals
3. **Client Communications**: Track emails/calls/meetings with clients
4. **Billing Integration**: Link cases to billing/invoices
5. **Document Templates**: Store case templates for common documents
6. **Advanced Reporting**: Case statistics, time tracking, revenue reports
7. **Mobile App**: React Native app for advocates on-the-go

---

**Implementation complete!** Your Advocate Pro now has full case management and hearing calendar capabilities.
