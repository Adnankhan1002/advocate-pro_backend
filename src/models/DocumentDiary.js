const mongoose = require('mongoose');

/**
 * Document Diary Model (Checklist + Reminders)
 * 
 * For each case:
 * - List of required documents
 * - What is pending
 * - Auto-reminders to client for pending docs
 * - Upload documents directly
 * - AI document verification (optional)
 */
const documentDiarySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    
    // CASE INFORMATION
    caseNumber: {
      type: String,
      required: true,
    },
    caseTitle: {
      type: String,
      required: true,
    },
    
    // DOCUMENT CHECKLIST
    documentChecklist: [
      {
        checklistId: mongoose.Schema.Types.ObjectId,
        documentName: {
          type: String,
          required: true,
        },
        documentType: {
          type: String,
          enum: ['identity_proof', 'address_proof', 'financial_documents', 'medical_reports', 'witness_statements', 'photographs', 'correspondence', 'agreements', 'certificates', 'licenses', 'permits', 'court_orders', 'affidavits', 'other'],
          required: true,
        },
        description: String,
        
        // DOCUMENT STATUS
        status: {
          type: String,
          enum: ['not_received', 'pending', 'received', 'verified', 'incomplete', 'rejected'],
          default: 'pending',
          index: true,
        },
        statusUpdatedAt: Date,
        statusUpdatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        
        // DUE DATE & DEADLINE
        dueDate: {
          type: Date,
          index: true,
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'urgent', 'critical'],
          default: 'medium',
        },
        
        // RESPONSIBILITY
        requiredFrom: {
          type: String,
          enum: ['client', 'court', 'opposite_party', 'advocate', 'expert', 'other'],
          required: true,
        },
        requiredFromDetails: {
          name: String,
          phone: String,
          email: String,
          contactPerson: String,
        },
        
        // DOCUMENT DETAILS (WHEN RECEIVED)
        document: {
          fileName: String,
          fileType: String,
          fileSize: Number,
          url: String,
          uploadedAt: Date,
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          versions: [
            {
              versionNumber: Number,
              fileName: String,
              url: String,
              uploadedAt: Date,
            },
          ],
        },
        
        // VERIFICATION
        verificationRequired: {
          type: Boolean,
          default: false,
        },
        verificationStatus: {
          type: String,
          enum: ['not_verified', 'verified', 'partially_verified', 'rejected'],
        },
        verificationDetails: {
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          verificationDate: Date,
          verificationNotes: String,
          aiVerificationScore: Number, // 0-100, if AI verification used
        },
        
        // AI DOCUMENT VERIFICATION (OPTIONAL)
        aiVerification: {
          enabled: {
            type: Boolean,
            default: false,
          },
          status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed'],
          },
          verificationResults: {
            documentAuthenticity: String,
            completenessScore: Number, // 0-100
            requiredFieldsPresent: [String],
            missingFields: [String],
            anomalies: [String],
            recommendation: String,
          },
        },
        
        // TRACKING
        requestedDate: Date,
        followUpDates: [
          {
            followUpDate: Date,
            followUpStatus: String,
          },
        ],
        
        // NOTES
        internalNotes: String,
        clientFacingNotes: String,
        
        // COPIES & CERTIFIED COPIES
        copiesRequired: {
          type: Boolean,
          default: false,
        },
        copiesReceived: Number,
        copiesRequired: Number,
        certifiedCopyRequired: {
          type: Boolean,
          default: false,
        },
        certifiedCopyReceived: {
          type: Boolean,
          default: false,
        },
      },
    ],
    
    // DOCUMENT SUMMARY
    documentSummary: {
      totalRequired: Number,
      totalReceived: Number,
      totalPending: Number,
      totalIncomplete: Number,
      completionPercentage: Number,
    },
    
    // REMINDERS TO CLIENT
    clientReminders: [
      {
        reminderId: mongoose.Schema.Types.ObjectId,
        documentName: String,
        reminderType: {
          type: String,
          enum: ['initial_request', 'first_reminder', 'urgent_reminder', 'final_reminder'],
        },
        reminderSent: {
          type: Boolean,
          default: false,
        },
        reminderSentAt: Date,
        reminderMode: {
          type: String,
          enum: ['email', 'sms', 'whatsapp', 'call', 'in_person'],
        },
        reminderMessage: String,
        clientResponse: {
          received: {
            type: Boolean,
            default: false,
          },
          responseDate: Date,
          responseMessage: String,
        },
      },
    ],
    
    // AUTOMATED REMINDER SETTINGS
    automatedReminders: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderSchedule: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'on_specific_dates'],
        default: 'once',
      },
      reminderDaysBeforeDue: Number,
      escalateIfNotReceived: {
        type: Boolean,
        default: true,
      },
      escalationDaysAfterDue: Number,
    },
    
    // DOCUMENT STORAGE & ORGANIZATION
    folderStructure: [
      {
        folderName: String,
        documents: [mongoose.Schema.Types.ObjectId],
      },
    ],
    
    // DEADLINES & MILESTONES
    deadlines: [
      {
        milestoneDate: Date,
        milestoneName: String,
        requiredDocuments: [String],
        allDocumentsReceived: Boolean,
      },
    ],
    
    // COMPLIANCE & REGULATORY
    complianceRequired: {
      type: Boolean,
      default: false,
    },
    complianceStandards: [String],
    auditTrail: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: String,
      },
    ],
    
    // METADATA
    tags: [String],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
documentDiarySchema.index({ tenantId: 1, caseId: 1 });
documentDiarySchema.index({ caseId: 1 });
documentDiarySchema.index({ 'documentChecklist.status': 1 });
documentDiarySchema.index({ 'documentChecklist.dueDate': 1 });

module.exports = mongoose.model('DocumentDiary', documentDiarySchema);
