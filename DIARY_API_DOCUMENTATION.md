# DIARY SYSTEM - COMPLETE API DOCUMENTATION

## Overview
This document provides comprehensive API documentation for the Advocate-Pro Diary System - a complete digital diary management solution for legal professionals.

---

## 1. DAILY DIARY API

### 1.1 Get Daily Diary for Specific Date
```
GET /api/diary/daily/:date
Authorization: Bearer <token>
```

**Parameters:**
- `date` (path): Date in format YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "date": "2025-12-03",
    "hearings": [],
    "clientMeetings": [],
    "followUps": [],
    "tasks": [],
    "deadlines": [],
    "alerts": []
  }
}
```

### 1.2 Create/Update Daily Diary
```
POST /api/diary/daily
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-03"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily diary created/updated successfully",
  "data": { ... }
}
```

### 1.3 Get Daily Diaries for Date Range
```
GET /api/diary/daily/range/list?startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer <token>
```

### 1.4 Acknowledge Alert
```
PUT /api/diary/daily/:diaryId/alert/:alertId/acknowledge
Authorization: Bearer <token>
```

### 1.5 Sync with Calendar
```
POST /api/diary/daily/:diaryId/sync-calendar
Authorization: Bearer <token>
Content-Type: application/json

{
  "calendarType": "google",
  "accessToken": "token_here"
}
```

---

## 2. COURT HEARING DIARY API

### 2.1 Create Court Hearing
```
POST /api/diary/court-hearing
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "ObjectId",
  "clientId": "ObjectId",
  "caseTitle": "State v/s X",
  "caseNumber": "2025-CC-0001",
  "court": {
    "name": "District Court",
    "location": "Mumbai",
    "jurisdiction": "Maharashtra"
  },
  "judge": {
    "name": "Justice Singh",
    "court": "District Court"
  },
  "hearing": {
    "date": "2025-12-10",
    "time": "10:30 AM",
    "courtRoom": "A-101",
    "itemNo": "15",
    "purposeOfHearing": "Evidence",
    "caseStage": "Evidence"
  },
  "nextHearing": {
    "date": "2025-12-20",
    "time": "10:30 AM",
    "purpose": "Continuation of Evidence"
  },
  "automation": {
    "reminderBeforeHearing": {
      "enabled": true,
      "hoursBeforeHearing": 24
    },
    "autoClientNotification": {
      "enabled": true
    }
  }
}
```

### 2.2 Get Court Hearing by ID
```
GET /api/diary/court-hearing/:id
Authorization: Bearer <token>
```

### 2.3 Get All Hearings for a Case
```
GET /api/diary/court-hearing/case/:caseId
Authorization: Bearer <token>
```

### 2.4 Get Today's Hearings
```
GET /api/diary/court-hearing/today/upcoming
Authorization: Bearer <token>
```

### 2.5 Update Court Hearing
```
PUT /api/diary/court-hearing/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "nextHearing": {
    "date": "2025-12-20",
    "time": "10:30 AM"
  }
}
```

### 2.6 Add Hearing Outcome
```
POST /api/diary/court-hearing/:id/outcome
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "orderDate": "2025-12-10",
  "orderStatus": "pronounced",
  "orderSummary": "Evidence to be closed in next hearing",
  "keyPoints": ["Point 1", "Point 2"],
  "observationNotes": "Court noted the submissions",
  "orderPDF": <file>,
  "voiceNote": <file>
}
```

### 2.7 Delete Court Hearing
```
DELETE /api/diary/court-hearing/:id
Authorization: Bearer <token>
```

---

## 3. PERSONAL & CLIENT MEETING DIARY API

### 3.1 Create Meeting Entry
```
POST /api/diary/meeting
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "ObjectId",
  "clientName": "John Doe",
  "purpose": "case_discussion",
  "description": "Discussed strategy for hearing",
  "meetingDate": "2025-12-03",
  "startTime": "10:30",
  "endTime": "11:30",
  "mode": "office",
  "modeDetails": {
    "office": {
      "location": "Conference Room A",
      "roomNumber": "101"
    }
  },
  "caseId": "ObjectId",
  "notes": {
    "mainPoints": ["Point 1", "Point 2"],
    "decisionsReached": ["Decision 1"],
    "actionItems": [
      {
        "item": "File petition",
        "owner": "advocate",
        "dueDate": "2025-12-05"
      }
    ]
  },
  "followUpReminder": {
    "enabled": true,
    "reminderDate": "2025-12-05",
    "reminderType": "in_app"
  }
}
```

### 3.2 Get Meeting by ID
```
GET /api/diary/meeting/:id
Authorization: Bearer <token>
```

### 3.3 Get All Meetings for a Client
```
GET /api/diary/meeting/client/:clientId
Authorization: Bearer <token>
```

### 3.4 Get Today's Meetings
```
GET /api/diary/meeting/today/list
Authorization: Bearer <token>
```

### 3.5 Update Meeting
```
PUT /api/diary/meeting/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": { ... },
  "feesDiscussed": 50000,
  "paymentMode": "bank_transfer"
}
```

### 3.6 Add Voice Note
```
POST /api/diary/meeting/:id/voice-note
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "voiceFile": <audio_file>
}
```

### 3.7 Send Follow-up Reminder
```
POST /api/diary/meeting/:id/send-reminder
Authorization: Bearer <token>
```

### 3.8 Delete Meeting
```
DELETE /api/diary/meeting/:id
Authorization: Bearer <token>
```

---

## 4. FOLLOW-UP DIARY API

### 4.1 Create Follow-Up Entry
```
POST /api/diary/follow-up
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "ObjectId",
  "clientId": "ObjectId",
  "followTarget": "court_staff",
  "followTargetDetails": {
    "name": "Registrar Office",
    "phone": "+91-XXXXXXXXXX",
    "email": "registrar@court.in"
  },
  "followObject": "order_delivery",
  "followObjectDescription": "Get copy of order from court",
  "expectedDeliverable": {
    "name": "Court Order",
    "description": "Original copy of order",
    "format": "physical"
  },
  "deadline": "2025-12-05",
  "priority": "high"
}
```

### 4.2 Get Follow-Up by ID
```
GET /api/diary/follow-up/:id
Authorization: Bearer <token>
```

### 4.3 Get All Follow-Ups
```
GET /api/diary/follow-up?status=pending&priority=high
Authorization: Bearer <token>

Query Parameters:
- status: pending | in_progress | done | overdue | cancelled
- priority: low | medium | high | urgent
- daysOverdue: number
```

### 4.4 Get Overdue Follow-Ups
```
GET /api/diary/follow-up/overdue/list
Authorization: Bearer <token>
```

### 4.5 Update Follow-Up
```
PUT /api/diary/follow-up/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "done",
  "resultSummary": "Order received from court",
  "resultDetails": {
    "resultDate": "2025-12-04",
    "successStatus": "fully_received"
  }
}
```

### 4.6 Log Follow-Up Attempt
```
POST /api/diary/follow-up/:id/attempt
Authorization: Bearer <token>
Content-Type: application/json

{
  "mode": "call",
  "notes": "Called registrar office",
  "outcome": "Order will be ready tomorrow",
  "nextFollowUpDate": "2025-12-05"
}
```

### 4.7 Send Reminder
```
POST /api/diary/follow-up/:id/send-reminder
Authorization: Bearer <token>
Content-Type: application/json

{
  "mode": "email"  // email | sms | whatsapp | in_person | all
}
```

### 4.8 Delete Follow-Up
```
DELETE /api/diary/follow-up/:id
Authorization: Bearer <token>
```

---

## 5. TASK & TO-DO DIARY API

### 5.1 Create Task
```
POST /api/diary/task
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Draft petition",
  "description": "Draft petition for bail application",
  "taskType": "document_drafting",
  "caseId": "ObjectId",
  "assignedTo": "ObjectId",  // User ID of junior advocate
  "deadline": "2025-12-05",
  "priority": "high",
  "estimatedTime": {
    "value": 4,
    "unit": "hours"
  },
  "subtasks": [
    {
      "title": "Research similar cases",
      "order": 1
    },
    {
      "title": "Prepare draft",
      "order": 2
    }
  ]
}
```

### 5.2 Get My Tasks
```
GET /api/diary/task/assigned/me?status=pending&priority=high
Authorization: Bearer <token>

Query Parameters:
- status: pending | in_progress | completed | on_hold | cancelled
- priority: low | medium | high | urgent
```

### 5.3 Get Task by ID
```
GET /api/diary/task/:id
Authorization: Bearer <token>
```

### 5.4 Update Task
```
PUT /api/diary/task/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "progressPercentage": 50
}
```

### 5.5 Update Subtask
```
PUT /api/diary/task/:taskId/subtask/:subtaskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Research similar cases",
  "completed": true
}
```

### 5.6 Submit Task
```
POST /api/diary/task/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "submissionNotes": "Petition draft completed and ready for review"
}
```

### 5.7 Review Task
```
POST /api/diary/task/:id/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",  // approved | needs_revision | rejected
  "comments": "Good work, minor changes needed"
}
```

### 5.8 Delete Task
```
DELETE /api/diary/task/:id
Authorization: Bearer <token>
```

---

## 6. CASE NOTES DIARY API

### 6.1 Create Case Note
```
POST /api/diary/case-notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "ObjectId",
  "noteTitle": "Evidence Strategy",
  "category": "strategy",  // strategy | opponent_arguments | research_points | evidence_notes | legal_citations | witness_preparation | hearing_observations | judgment_analysis | client_notes | general_notes
  "noteContent": "Our strategy is to challenge the authenticity of documents",
  "strategy": {
    "strategicApproach": "Aggressive cross-examination",
    "keyArguments": ["Argument 1", "Argument 2"],
    "weaknesses": ["Weakness 1"],
    "strengths": ["Strength 1"],
    "risks": ["Risk 1"],
    "opportunities": ["Opportunity 1"]
  },
  "tags": ["strategy", "evidence"],
  "visibility": "private"  // private | team | public
}
```

### 6.2 Get Case Note by ID
```
GET /api/diary/case-notes/:id
Authorization: Bearer <token>
```

### 6.3 Get All Case Notes for a Case
```
GET /api/diary/case-notes/case/:caseId
Authorization: Bearer <token>
```

### 6.4 Search Case Notes
```
GET /api/diary/case-notes/search?query=evidence&caseId=ObjectId&category=strategy
Authorization: Bearer <token>

Query Parameters:
- query: search string
- caseId: ObjectId
- category: note category
```

### 6.5 Update Case Note
```
PUT /api/diary/case-notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "noteContent": "Updated content",
  "changeDescription": "Revised strategy based on new evidence"
}
```

### 6.6 Add Attachment
```
POST /api/diary/case-notes/:id/attachment
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "attachmentType": "pdf",
  "file": <file>,
  "description": "Evidence document"
}
```

### 6.7 Add Handwritten Note (Image)
```
POST /api/diary/case-notes/:id/handwritten
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <image_file>,
  "dateTaken": "2025-12-03",
  "description": "Court observation notes"
}
```

### 6.8 Delete Case Note
```
DELETE /api/diary/case-notes/:id
Authorization: Bearer <token>
```

---

## 7. EXPENSE DIARY API

### 7.1 Create Expense Entry
```
POST /api/diary/expense
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "ObjectId",
  "clientId": "ObjectId",
  "expenseTitle": "Court filing fees",
  "expenseType": "filing_fee",
  "amount": 5000,
  "currency": "INR",
  "taxApplicable": true,
  "taxPercentage": 18,
  "expenseDate": "2025-12-03",
  "paymentMode": "bank_transfer",
  "paymentDetails": {
    "transactionId": "TXN123456"
  },
  "description": "Filing petition for bail",
  "vendorDetails": {
    "vendorName": "District Court Registry",
    "gstNumber": "27AAACR5055K1Z0"
  },
  "billedToClient": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense recorded successfully",
  "data": {
    "_id": "ObjectId",
    "totalAmount": 5900,  // 5000 + (5000 * 18%)
    "taxAmount": 900,
    "status": "recorded"
  }
}
```

### 7.2 Get Expense by ID
```
GET /api/diary/expense/:id
Authorization: Bearer <token>
```

### 7.3 Get All Expenses for a Case
```
GET /api/diary/expense/case/:caseId
Authorization: Bearer <token>

Response includes:
- Individual expenses list
- Summary: totalExpenses, billableExpenses, nonBillableExpenses
```

### 7.4 Get Expense Ledger (Complete Report)
```
GET /api/diary/expense/case/:caseId/ledger
Authorization: Bearer <token>

Response:
{
  "success": true,
  "summary": {
    "caseNumber": "2025-CC-0001",
    "totalExpenses": 45000,
    "billableExpenses": 30000,
    "nonBillableExpenses": 15000
  },
  "ledgerByType": { ... },
  "ledgerByDate": { ... },
  "expenses": [ ... ]
}
```

### 7.5 Update Expense
```
PUT /api/diary/expense/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5500,
  "status": "paid"
}
```

### 7.6 Verify Expense
```
POST /api/diary/expense/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",  // approved | rejected | needs_review
  "notes": "Expense verified and approved"
}
```

### 7.7 Delete Expense
```
DELETE /api/diary/expense/:id
Authorization: Bearer <token>
```

---

## 8. DOCUMENT DIARY API

### 8.1 Create Document Diary
```
POST /api/diary/document
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "ObjectId",
  "clientId": "ObjectId",
  "documentChecklist": [
    {
      "documentName": "Client Identity Proof",
      "documentType": "identity_proof",
      "description": "Aadhar or Pan Card",
      "dueDate": "2025-12-05",
      "priority": "high",
      "requiredFrom": "client"
    }
  ],
  "automatedReminders": {
    "enabled": true,
    "reminderSchedule": "weekly",
    "reminderDaysBeforeDue": 3,
    "escalateIfNotReceived": true,
    "escalationDaysAfterDue": 5
  }
}
```

### 8.2 Get Document Diary for Case
```
GET /api/diary/document/case/:caseId
Authorization: Bearer <token>
```

### 8.3 Add Document to Checklist
```
POST /api/diary/document/case/:caseId/checklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentName": "Address Proof",
  "documentType": "address_proof",
  "description": "Recent utility bill or property document",
  "dueDate": "2025-12-10",
  "priority": "medium",
  "requiredFrom": "client",
  "requiredFromDetails": {
    "name": "John Doe",
    "phone": "+91-XXXXXXXXXX",
    "email": "john@example.com"
  }
}
```

### 8.4 Update Document Status
```
PUT /api/diary/document/case/:caseId/checklist/:checklistId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "received",  // not_received | pending | received | verified | incomplete | rejected
  "verificationStatus": "verified",
  "notes": "Document verified and filed"
}
```

### 8.5 Upload Document
```
POST /api/diary/document/case/:caseId/checklist/:checklistId/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "documentFile": <file>
}
```

### 8.6 Send Reminder to Client
```
POST /api/diary/document/case/:caseId/send-reminder
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentIds": ["checklistId1", "checklistId2"],  // optional
  "mode": "email"  // email | sms | all
}
```

### 8.7 AI Verify Document
```
POST /api/diary/document/case/:caseId/checklist/:checklistId/ai-verify
Authorization: Bearer <token>
```

---

## 9. CONFIDENTIAL LAWYER DIARY API

### 9.1 Create Confidential Entry
```
POST /api/diary/confidential
Authorization: Bearer <token>
Content-Type: application/json

{
  "entryTitle": "Strategy for dismissal",
  "entryType": "case_strategy",  // case_strategy | client_confidential | legal_strategy | internal_notes | personal_reflections | risk_analysis | financial_notes | business_strategy
  "sensitivityLevel": "highly_confidential",  // confidential | highly_confidential | top_secret
  "caseId": "ObjectId",
  "clientId": "ObjectId",
  "entryContent": "Plan to challenge validity of evidence",
  "caseStrategy": {
    "strategicApproach": "Aggressive defense",
    "strengths": ["No evidence of intent"],
    "risks": ["Witness credibility"]
  },
  "tags": ["sensitive", "strategy"],
  "biometricLockRequired": true,
  "passwordProtected": true
}
```

**⚠️ IMPORTANT:**
- Only accessible to the owner (creator)
- All access is logged for audit purposes
- Cannot be shared except with specific permission
- Marked for deletion after specified period

### 9.2 Get Confidential Entry
```
GET /api/diary/confidential/:id
Authorization: Bearer <token>

⚠️ OWNER ONLY - Returns 403 if not owner
```

### 9.3 Get All Confidential Entries
```
GET /api/diary/confidential?sensitivityLevel=highly_confidential&entryType=case_strategy
Authorization: Bearer <token>

Query Parameters:
- sensitivityLevel: confidential | highly_confidential | top_secret
- entryType: see entryType values above
```

### 9.4 Update Confidential Entry
```
PUT /api/diary/confidential/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "entryContent": "Updated strategy",
  "changeDescription": "Revised after new evidence"
}

⚠️ OWNER ONLY - Version history maintained
```

### 9.5 Share with Another Advocate
```
POST /api/diary/confidential/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "shareWithUserId": "ObjectId",
  "permissions": "view_only"  // view_only | edit | delete
}

⚠️ OWNER ONLY - Shared user must be in same tenant
```

### 9.6 Revoke Share
```
DELETE /api/diary/confidential/:id/share/:shareId
Authorization: Bearer <token>

⚠️ OWNER ONLY
```

### 9.7 Get Access Log (Audit Trail)
```
GET /api/diary/confidential/:id/access-log
Authorization: Bearer <token>

Returns:
- Who accessed the entry
- When they accessed it
- What action they performed
- IP address and device info

⚠️ OWNER ONLY
```

### 9.8 Delete Confidential Entry
```
DELETE /api/diary/confidential/:id
Authorization: Bearer <token>

⚠️ OWNER ONLY - Marked as deleted, not permanently removed
```

---

## ERROR RESPONSES

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes:
- `400` - Bad Request (missing/invalid fields)
- `401` - Unauthorized (no valid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## AUTHENTICATION

All endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

Get token from `/api/auth/login` endpoint.

---

## PAGINATION (Future Enhancement)

Implement pagination for list endpoints with query parameters:
```
?page=1&limit=20&sort=-createdAt
```

---

## WEBHOOKS (Future Enhancement)

Real-time notifications for:
- Hearing reminders
- Overdue follow-ups
- Document requests
- Task assignments
- Case updates

---

## RATE LIMITING

- 100 requests per minute per user
- 1000 requests per hour per user

---

## SECURITY

- All endpoints require authentication
- Data encrypted at rest
- SSL/TLS for transit
- SQL injection prevention
- XSS protection
- CSRF tokens for state-changing operations
- Confidential entries have additional encryption
- Access logs maintained for audit trail

---

## BEST PRACTICES

1. **Always include error handling** in client code
2. **Use pagination** for large datasets
3. **Cache responses** where applicable
4. **Implement retry logic** for failed requests
5. **Monitor rate limits** and adjust accordingly
6. **Log all API calls** for debugging
7. **Use webhooks** for real-time updates instead of polling
8. **Validate input** before sending requests
9. **Handle token expiration** gracefully
10. **Keep API keys secure** - never commit to version control

