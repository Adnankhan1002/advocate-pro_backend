# Legal Document Generation Service

This document explains the AI-powered legal document generation service integrated with Gemini API.

## Overview

The Document Generator Service uses Google's Gemini AI to create professional Indian legal documents including:
- **Bail Applications** - Following CrPC 1973 conventions
- **Legal Notices** - Compliant with Indian legal standards
- **Petitions** - Formatted for Indian courts

## Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key for your project
4. Copy the API key

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies

```bash
cd Backend
npm install @google/generative-ai
```

## Database Schema

### Document Model

```javascript
{
  tenantId: ObjectId,              // Multi-tenant support
  caseId: ObjectId,                // Associated case
  documentType: String,             // bail_application, legal_notice, petition
  title: String,                    // Generated title
  content: String,                  // Full document content (AI-generated)
  generatedByAI: Boolean,           // Always true for AI-generated docs
  inputData: {
    facts: String,                  // Case facts provided by user
    fir: String,                    // FIR details
    clientDetails: String,          // Client information
    additionalInfo: String          // Additional context
  },
  metadata: {
    generatedAt: Date,              // When document was generated
    model: String,                  // Gemini model used
    promptVersion: String           // Version of the prompt template
  },
  status: String,                   // draft, finalized, archived
  createdBy: ObjectId,              // User who created it
  approvedBy: ObjectId,             // User who approved it
  approvedAt: Date,                 // When approved
  tags: [String],                   // Custom tags
  notes: String,                    // Additional notes
  isActive: Boolean,                // Soft delete flag
  timestamps: true                  // createdAt, updatedAt
}
```

## API Endpoints

### Generate Document

**POST** `/api/documents/generate`

Request body:
```json
{
  "caseId": "case_id_here",
  "documentType": "bail_application|legal_notice|petition",
  "facts": "Detailed facts of the case...",
  "fir": "FIR Number: 12345/2024, filed at XYZ Police Station...",
  "clientDetails": "Name: John Doe, Address: ..., Occupation: ...",
  "additionalInfo": "Optional additional context..."
}
```

Response:
```json
{
  "success": true,
  "message": "Document generated successfully",
  "data": {
    "_id": "document_id",
    "title": "Bail Application - Case 12345/2024",
    "documentType": "bail_application",
    "status": "draft",
    "generatedByAI": true,
    "content": "Full document content...",
    "createdAt": "2024-11-25T10:30:00Z"
  }
}
```

### Get All Documents

**GET** `/api/documents?page=1&limit=10&documentType=bail_application&status=draft`

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `caseId` - Filter by case
- `documentType` - Filter by type
- `status` - Filter by status

### Get Document by ID

**GET** `/api/documents/:documentId`

### Update Document

**PATCH** `/api/documents/:documentId`

Request body:
```json
{
  "content": "Updated content...",
  "status": "finalized|draft|archived",
  "notes": "Reviewer notes...",
  "tags": ["tag1", "tag2"]
}
```

### Delete Document

**DELETE** `/api/documents/:documentId`

(Soft delete - marks as inactive)

### Get Documents for a Case

**GET** `/api/documents/case/:caseId`

### Export Document

**GET** `/api/documents/:documentId/export?format=txt`

Query parameters:
- `format` - Currently supports: `txt`

Downloads document as a text file.

## Document Generation Process

### Prompt Engineering

The service uses sophisticated prompts tailored for each document type:

#### Bail Application Prompt
- Includes CrPC 1973 references (Sections 437, 438)
- Structured with legal sections
- Incorporates IPC sections
- Uses formal legal language
- Includes character assessment sections

#### Legal Notice Prompt
- Follows proper notice formatting
- References Section 80 CPC where applicable
- Includes service method specifications
- Clear timeline and consequences

#### Petition Prompt
- Constitutional and civil law focus
- Proper court jurisdiction formatting
- References Constitution articles
- Includes verification clause
- Prayer section with interim reliefs

### Input Parameters

Each document requires:
1. **Facts** - Chronological narrative of events
2. **FIR** - Police report details and reference
3. **Client Details** - Complete client information
4. **Additional Info** - Context-specific details (grounds, claims, etc.)

## Features

### Multi-Tenant Support
- Each document is associated with a specific tenant
- Isolation between organizations

### Status Workflow
- **Draft** - Initial AI-generated state
- **Finalized** - Approved by senior advocate
- **Archived** - No longer in use

### AI Tracking
- `generatedByAI: true` flag indicates AI-generated content
- Model and prompt version stored for audit
- Full input data preserved for regeneration

### User Tracking
- `createdBy` - Original document creator
- `approvedBy` - Approver information
- Full audit trail with timestamps

## Example Usage

### Frontend Integration

```typescript
// Generate bail application
const response = await fetch('/api/documents/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    caseId: '6456789...',
    documentType: 'bail_application',
    facts: 'Accused was arrested on 25-Nov-2024...',
    fir: 'FIR No. 123/2024, Police Station: XYZ',
    clientDetails: 'Name: John Doe, Age: 35...',
    additionalInfo: 'First-time offender, strong community ties'
  })
});

const document = await response.json();
console.log(document.data.content);
```

## Quality Assurance

### Validation
- Input data validation using Joi
- Case ownership verification
- Tenant isolation checks

### Error Handling
- Comprehensive error messages
- API rate limit handling
- Graceful fallbacks

## Limitations & Considerations

1. **API Rate Limits** - Gemini API has rate limits; implement caching where needed
2. **Model Updates** - Currently uses `gemini-1.5-flash`; can be upgraded
3. **Document Length** - Optimized for documents of 800-1500 words
4. **Language** - English legal language (Indian law references)
5. **Manual Review** - AI-generated documents should be reviewed by lawyers

## Security Considerations

1. **API Key Protection** - Never commit API key to version control
2. **Input Validation** - All inputs are validated
3. **Access Control** - Authentication required on all endpoints
4. **Tenant Isolation** - Strict multi-tenant checks
5. **Soft Deletes** - No permanent deletion of documents

## Troubleshooting

### Error: "GEMINI_API_KEY is not configured"
- Verify `.env` file has `GEMINI_API_KEY`
- Restart the server after adding the key

### Error: "Empty response from Gemini API"
- Check API key is valid
- Verify internet connection
- Check rate limits haven't been exceeded

### Slow Generation
- Gemini API may take 10-30 seconds depending on load
- Consider implementing progress indicators on frontend

## Future Enhancements

1. PDF export functionality
2. Document versioning and history
3. Custom template support
4. Batch document generation
5. Integration with document management systems
6. Support for additional document types
7. Multi-language support
8. Advanced document editing interface

## Support

For issues or feature requests, contact the development team.
