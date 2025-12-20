# DIARY SYSTEM - IMPLEMENTATION GUIDE

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Models](#database-models)
3. [Controllers & Services](#controllers--services)
4. [Routes & Endpoints](#routes--endpoints)
5. [Features Implemented](#features-implemented)
6. [Automation Features](#automation-features)
7. [Security & Access Control](#security--access-control)
8. [Setup & Deployment](#setup--deployment)
9. [Future Enhancements](#future-enhancements)

---

## System Architecture

### Layered Architecture
```
┌─────────────────────────────────┐
│      Frontend (Next.js)         │
│   UI Components & Pages         │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│    API Layer (Express.js)       │
│   Routes & Controllers          │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│    Business Logic (Services)    │
│ Validation, Processing, Crons   │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│    Data Access (MongoDB)        │
│   Models & Queries              │
└─────────────────────────────────┘
```

### Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **Validation**: Joi & Zod
- **Task Scheduling**: Node-cron
- **Notifications**: Nodemailer, Twilio
- **AI Services**: Google GenAI (for document verification & transcription)
- **File Storage**: Multer (local/cloud ready)

---

## Database Models

### 1. DailyDiary
- **Purpose**: Single dashboard showing today's important items
- **Collections**:
  - Today's hearings
  - Today's client meetings
  - Today's follow-ups
  - Today's tasks
  - Important deadlines
  - System alerts
- **Automation**: Auto-generates from other diary entries
- **Indexes**: tenantId, userId, date

### 2. CourtHearingDiary
- **Purpose**: Comprehensive court hearing management
- **Features**:
  - Court and judge details
  - Hearing purpose & case stage tracking
  - Automatic client notifications
  - Order/outcome recording
  - Document & voice note uploads
  - Auto-reminder scheduling
- **Key Fields**:
  - hearing.date, hearing.time, hearing.courtRoom
  - nextHearing with auto-notification
  - outcome with order PDF/voice notes
  - automation settings
- **Indexes**: caseId, hearing.date, clientId

### 3. PersonalClientMeetingDiary
- **Purpose**: Track all client & staff meetings
- **Features**:
  - Multiple meeting modes (office, phone, video, court)
  - Meeting notes with action items
  - Voice note recording
  - Follow-up reminders
  - Fee tracking
  - Attendance tracking
- **Key Fields**:
  - meetingDate, mode (office/phone/video/court_meeting)
  - notes with mainPoints, decisionsReached, actionItems
  - followUpReminder settings
  - voiceNotes array
- **Indexes**: userId, meetingDate, clientId

### 4. FollowUpDiary
- **Purpose**: Systematic tracking of 100+ weekly follow-ups
- **Features**:
  - Track who to follow & what to follow
  - Status management with history
  - Auto-reminders (24 hours before deadline)
  - Auto-escalation if missed
  - Follow-up attempt logging
  - Cost tracking
- **Key Fields**:
  - followTarget (client, police, court, etc.)
  - followObject (documents, case update, etc.)
  - deadline with status tracking
  - autoEscalation settings
  - followUpAttempts with history
- **Indexes**: userId, deadline, status, priority

### 5. TaskToDoDiary
- **Purpose**: Task assignment & team collaboration
- **Features**:
  - Create tasks for team members
  - Subtask management
  - Progress tracking (percentage)
  - Submission & review workflow
  - Time tracking
  - Task dependencies
  - Comment & collaboration
- **Key Fields**:
  - assignedTo with role details
  - deadline with priority
  - subtasks with completion tracking
  - submissionDetails & reviewStatus
  - timeEntries for time tracking
- **Indexes**: tenantId, assignedTo, deadline, status

### 6. CaseNotesDiary
- **Purpose**: Mini-diary for each case
- **Features**:
  - Multiple note categories
  - Strategy documentation
  - Opponent analysis
  - Research & citations
  - Evidence tracking
  - Witness preparation
  - Handwritten notes (OCR ready)
  - Version history
- **Key Fields**:
  - category (strategy, research, evidence, etc.)
  - visibility (private, team, public)
  - attachments & handwrittenNotes
  - versions for history
- **Indexes**: caseId, userId, category, tags

### 7. ExpenseDiary
- **Purpose**: Complete expense tracking & billing
- **Features**:
  - Multiple expense types
  - GST/VAT calculation
  - Payment mode tracking
  - Billable vs non-billable
  - Verification workflow
  - Reimbursement tracking
  - Expense ledger generation
- **Key Fields**:
  - expenseType with amount
  - taxApplicable with percentage
  - paymentMode with details
  - verificationStatus
  - billedToClient flag
- **Indexes**: caseId, expenseDate, paymentStatus

### 8. DocumentDiary
- **Purpose**: Document checklist & tracking
- **Features**:
  - Required documents checklist
  - Status tracking per document
  - Upload directly to checklist
  - AI document verification (optional)
  - Auto-reminders to client
  - Compliance tracking
- **Key Fields**:
  - documentChecklist array
  - documentSummary (completion %)
  - automatedReminders settings
  - clientReminders for tracking
- **Indexes**: caseId, documentChecklist.status

### 9. ConfidentialLawyerDiary
- **Purpose**: Highly sensitive private diary
- **Features**:
  - Owner-only access
  - Full access logging & audit trail
  - Optional biometric lock
  - Optional password protection
  - Limited sharing capability
  - Version history
  - Auto-deletion scheduling
- **Key Fields**:
  - sensitivityLevel (confidential, highly_confidential, top_secret)
  - encrypted flag
  - accessLog with full audit trail
  - sharedWith with granular permissions
- **Indexes**: userId, createdAt, sensitivityLevel

---

## Controllers & Services

### Controller Structure
```
controllers/
├── dailyDiaryController.js
├── courtHearingDiaryController.js
├── personalClientMeetingDiaryController.js
├── followUpDiaryController.js
├── taskToDoDiaryController.js
├── caseNotesDiaryController.js
├── expenseDiaryController.js
├── documentDiaryController.js
└── confidentialLawyerDiaryController.js
```

### Key Controller Functions

#### Daily Diary Controller
- `getDailyDiary(date)` - Get diary for specific date
- `createOrUpdateDailyDiary()` - Auto-populate from other diaries
- `getDailyDiaryRange(startDate, endDate)` - Range queries
- `acknowledgeAlert(alertId)` - Acknowledge system alerts
- `syncWithCalendar(calendarType)` - Google/Outlook sync

#### Court Hearing Diary Controller
- `createCourtHearing()` - Create hearing entry
- `getCourtHearingsByCase(caseId)` - Get case hearings
- `getTodayHearings()` - Get today's hearings
- `updateCourtHearing()` - Update with auto-notifications
- `addHearingOutcome()` - Record order & observations
- `deleteCourtHearing()` - Soft delete

#### Meeting Diary Controller
- `createMeeting()` - Create meeting entry
- `getMeetingsByClient()` - Get client's meetings
- `getTodayMeetings()` - Get today's meetings
- `addVoiceNote()` - Upload voice recording
- `sendFollowUpReminder()` - Send via email/SMS
- `updateMeeting()` - Update meeting details

#### Follow-Up Diary Controller
- `createFollowUp()` - Create follow-up entry
- `getAllFollowUps()` - Get with filtering & sorting
- `getOverdueFollowUps()` - High-priority list
- `updateFollowUp()` - Track status changes
- `logFollowUpAttempt()` - Log each attempt
- `sendFollowUpReminder()` - Auto-reminder system

#### Task Diary Controller
- `createTask()` - Create & assign task
- `getMyTasks()` - Get user's assigned tasks
- `updateTask()` - Update with status history
- `updateSubtask()` - Manage subtasks
- `submitTask()` - Submit for review
- `reviewTask()` - Approve/reject with feedback

#### Case Notes Controller
- `createCaseNote()` - Create note with category
- `getCaseNotesByCase()` - Get all case notes
- `searchCaseNotes()` - Full-text search
- `updateCaseNote()` - Update with version history
- `addAttachment()` - Upload files
- `addHandwrittenNote()` - Upload images (OCR ready)

#### Expense Controller
- `createExpense()` - Record expense
- `getExpensesByCase()` - Get case expenses
- `getExpenseLedger()` - Generate full ledger
- `verifyExpense()` - Verification workflow
- `updateExpense()` - Update with recalculation
- `deleteExpense()` - Soft delete with rollback

#### Document Diary Controller
- `createDocumentDiary()` - Create checklist
- `addDocumentToChecklist()` - Add required docs
- `uploadDocument()` - Upload to checklist
- `updateDocumentStatus()` - Track status
- `sendDocumentReminder()` - Auto-reminders to client
- `aiVerifyDocument()` - AI verification

#### Confidential Diary Controller
- `createConfidentialEntry()` - Create private entry
- `getConfidentialEntry()` - Get (OWNER ONLY)
- `updateConfidentialEntry()` - Update with version control
- `shareConfidentialEntry()` - Share with permissions
- `revokeShare()` - Remove sharing
- `getAccessLog()` - Full audit trail

### Services Layer

#### cronService.js
Handles automated tasks:
- Daily diary generation at midnight
- 24-hour hearing reminders
- Overdue follow-up escalation
- Pending document reminders
- Case limitation alerts
- Automated client notifications

#### documentGeneratorService.js
- Generate expense ledgers
- Generate case summaries
- Create PDF reports
- Export to Excel

#### reminderService.js
- Email reminders via Nodemailer
- SMS reminders via Twilio
- In-app notifications
- Push notifications (future)

---

## Routes & Endpoints

### Route Files
```
routes/
├── dailyDiaryRoutes.js          → /api/diary/daily
├── courtHearingDiaryRoutes.js   → /api/diary/court-hearing
├── meetingDiaryRoutes.js        → /api/diary/meeting
├── followUpDiaryRoutes.js       → /api/diary/follow-up
├── taskToDoDiaryRoutes.js       → /api/diary/task
├── caseNotesDiaryRoutes.js      → /api/diary/case-notes
├── expenseDiaryRoutes.js        → /api/diary/expense
├── documentDiaryRoutes.js       → /api/diary/document
└── confidentialLawyerDiaryRoutes.js → /api/diary/confidential
```

### Base URL: `/api/diary`

**See DIARY_API_DOCUMENTATION.md for complete endpoint details**

---

## Features Implemented

### ✅ 1. Daily Diary Dashboard
- [x] Display today's hearings
- [x] Display today's client meetings
- [x] Display today's follow-ups
- [x] Display pending tasks
- [x] Show important deadlines
- [x] Alert system for urgent matters
- [x] Auto-sync with Google/Outlook calendar
- [x] Priority system (Red/Yellow/Green)

### ✅ 2. Court Hearing Diary
- [x] Case title (State v/s X format)
- [x] Court name (District/High/Supreme/Tribunal)
- [x] Judge name & bench number
- [x] Case stage tracking
- [x] Hearing purpose documentation
- [x] Next hearing scheduling
- [x] Auto-reminder before hearing
- [x] Auto-message to client
- [x] Order PDF upload
- [x] Voice note recording
- [x] Attendance tracking

### ✅ 3. Personal & Client Meeting Diary
- [x] Client name & meeting details
- [x] Multiple meeting modes (office/phone/video/court)
- [x] Meeting notes with action items
- [x] Voice note recording
- [x] Follow-up reminders
- [x] Fee tracking
- [x] Attendee list
- [x] Meeting duration calculation

### ✅ 4. Follow-Up Diary
- [x] Follow target (client/police/court/counsel)
- [x] Follow object (documents/updates/etc.)
- [x] Deadline management
- [x] Status tracking (Pending/Done)
- [x] Auto-remind 24 hours before
- [x] Auto-escalate if missed
- [x] Attempt logging
- [x] Cost tracking

### ✅ 5. Task & To-Do Diary
- [x] Create tasks for team members
- [x] Assign to juniors/clerks
- [x] Set deadlines & priority
- [x] Attach documents
- [x] Progress tracking (Pending → In Progress → Done)
- [x] Subtask management
- [x] Task review workflow
- [x] Comments & collaboration
- [x] Time tracking

### ✅ 6. Case Notes Diary
- [x] Strategy notes
- [x] Opponent arguments tracking
- [x] Research points & legal citations
- [x] Evidence notes
- [x] Witness preparation notes
- [x] Handwritten notes (image upload)
- [x] Version history
- [x] Visibility control (Private/Team/Public)
- [x] Search functionality

### ✅ 7. Expense Diary
- [x] Multiple expense types (filing/drafting/clerk/etc.)
- [x] Amount tracking with GST calculation
- [x] Payment mode options
- [x] Vendor details
- [x] Receipt uploads
- [x] Billable vs non-billable tracking
- [x] Verification workflow
- [x] Auto-generate expense ledger per case
- [x] Reimbursement tracking

### ✅ 8. Document Diary (Checklist + Reminders)
- [x] Required documents checklist per case
- [x] Track document status
- [x] Upload documents directly
- [x] Auto-reminders to client for pending docs
- [x] Document verification status
- [x] AI document verification (framework ready)
- [x] Copy & certified copy tracking
- [x] Compliance tracking

### ✅ 9. Confidential Lawyer Diary
- [x] Private diary (owner-only access)
- [x] Multiple sensitivity levels
- [x] Full access logging & audit trail
- [x] Optional biometric lock support
- [x] Optional password protection
- [x] Limited sharing capability
- [x] Version history
- [x] Auto-deletion scheduling

---

## Automation Features

### 1. Automatic Reminders
- **24-hour hearing reminder** before scheduled hearing
- **Overdue follow-up alerts** - escalate to urgent if missed
- **Document request reminders** - 3 days before due date
- **Task deadline reminders** - 1 day before, on day
- **Payment reminders** - for pending payments

### 2. Auto-Generated Content
- **Daily Diary** - auto-populated at midnight from all diary entries
- **Case Alerts** - generated for case limitations, upcoming deadlines
- **Status Updates** - auto-transition tasks based on rules
- **Expense Updates** - auto-update case spent amount

### 3. Auto-Notifications
- **Client Notifications** - hearing updates, document requests
- **Team Notifications** - task assignments, urgent follow-ups
- **Email/SMS** - configurable channels
- **WhatsApp** - future integration

### 4. Auto-Escalation
- **Overdue Follow-ups** - escalate from normal to high priority
- **Missed Deadlines** - flag for senior advocate review
- **Pending Documents** - repeated reminders with escalation
- **Overdue Tasks** - marked as critical

### 5. Scheduled Jobs
```javascript
// Implemented in cronService.js
- Daily diary generation (midnight)
- Hearing reminders (24 hours before)
- Follow-up reminders (24 hours before deadline)
- Overdue escalation (on deadline + 1 day)
- Document reminders (weekly)
- Case limitation alerts (quarterly)
```

---

## Security & Access Control

### Authentication
- JWT-based authentication
- Token expiration & refresh
- Role-based access (OWNER, ADMIN, ADVOCATE, STAFF, CLIENT)

### Authorization
- **Tenant Isolation**: All queries filtered by tenantId
- **User Isolation**: Personal data visible only to owner
- **Role-based Access**:
  - ADVOCATE: Can create/manage own diaries
  - ADMIN: Can manage team members' diaries
  - OWNER: Can manage all
  - STAFF/CLERK: Can view assigned tasks
  - CLIENT: Can view their own case info

### Confidential Diary Security
- **Owner-Only Access**: Enforced at controller level
- **Full Audit Trail**: All access logged (view, edit, delete, share)
- **IP & Device Tracking**: Logged for security
- **Biometric Lock Support**: Front-end implementation
- **Password Protection**: Optional second layer
- **Encryption**: Sensitive fields encrypted at rest

### Data Protection
- **Soft Deletes**: No permanent deletion, status-based
- **Version Control**: All updates logged with changes
- **Access Logs**: Complete audit trail
- **Backup Strategy**: MongoDB built-in replication

---

## Setup & Deployment

### Prerequisites
```bash
Node.js >= 14.0.0
MongoDB >= 4.0
npm or yarn
```

### Installation
```bash
# Clone repository
git clone <repo-url>
cd advocate-pro/Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/advocate-pro
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=5000
```

### Running the Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start

# Testing
npm test
```

### Database Initialization
```bash
# The system auto-creates indexes on first run
# No manual schema creation needed
```

---

## Future Enhancements

### Phase 2 Features
- [ ] AI Hearing Summary Generator
- [ ] AI Client Communication Automation
- [ ] AI Daily Planner with task prioritization
- [ ] Court Cause List Integration (auto-fetch)
- [ ] Voice-to-Diary (speech-to-text)
- [ ] WhatsApp Integration
- [ ] SMS Gateway Integration
- [ ] Calendar Integration (Google/Outlook)

### Phase 3 Features
- [ ] Advanced Analytics & Reporting
- [ ] Predictive Analytics (case outcomes)
- [ ] Document Template Library
- [ ] Billing & Invoice Generation
- [ ] Client Portal
- [ ] Mobile App (React Native)
- [ ] Webhook Integrations
- [ ] API Rate Limiting
- [ ] Advanced Search (Elasticsearch)
- [ ] Video Conferencing Integration

### Phase 4 Premium Features
- [ ] Machine Learning for case analysis
- [ ] Predictive case outcomes
- [ ] Automated legal research
- [ ] Compliance monitoring
- [ ] Advanced reporting & analytics
- [ ] Custom dashboards
- [ ] Team performance metrics
- [ ] Profitability analysis

---

## Performance Optimization

### Indexing Strategy
- All main queries have indexes
- Compound indexes for common filters
- Text indexes for search (future)

### Caching
- Implement Redis for:
  - User sessions
  - Frequently accessed data
  - Daily diary (cached for 1 hour)

### Query Optimization
- Use `.select()` to limit fields
- Use `.lean()` for read-only queries
- Implement pagination for large datasets
- Use aggregation pipeline for complex queries

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- Database query logs

---

## Testing

### Unit Tests (todo)
```bash
npm test -- controllers/
npm test -- models/
npm test -- services/
```

### Integration Tests (todo)
```bash
npm test -- integration/
```

### E2E Tests (todo)
```bash
npm run test:e2e
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas cluster set up
- [ ] JWT secret configured
- [ ] CORS properly configured
- [ ] File storage configured (S3/local)
- [ ] Email service configured (Nodemailer)
- [ ] SMS service configured (Twilio)
- [ ] Logs configured
- [ ] Error tracking enabled (Sentry)
- [ ] Rate limiting enabled
- [ ] Security headers enabled (Helmet)
- [ ] HTTPS enforced
- [ ] Database backups configured
- [ ] Monitoring set up

---

## Support & Documentation

- **API Documentation**: `/DIARY_API_DOCUMENTATION.md`
- **Setup Guide**: This file
- **Code Comments**: Well-documented in source code
- **Swagger UI**: Available at `/api-docs`

---

## Contact & Issues

For questions or issues:
1. Check the documentation
2. Review code comments
3. Check error logs
4. Contact development team

