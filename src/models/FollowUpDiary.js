const mongoose = require('mongoose');

/**
 * Follow-Up Diary Model
 * 
 * Advocates handle 100+ follow-ups weekly.
 * This diary tracks all follow-ups systematically.
 * 
 * Features:
 * - Track who to follow and what to follow
 * - Set deadlines
 * - Auto-reminders 24 hours before
 * - Auto-escalate to high priority if missed
 */
const followUpDiarySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // CASE & CLIENT INFORMATION
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    caseNumber: String,
    clientName: String,
    
    // WHOM TO FOLLOW
    followTarget: {
      type: String,
      required: [true, 'Follow target is required'],
      enum: ['client', 'police_station', 'court_staff', 'opposite_counsel', 'opposite_party', 'bank', 'department', 'registry', 'other'],
    },
    followTargetDetails: {
      name: String,
      phone: String,
      email: String,
      designation: String,
      department: String,
      location: String,
    },
    
    // WHAT TO FOLLOW
    followObject: {
      type: String,
      required: [true, 'Follow object is required'],
      enum: ['documents', 'case_update', 'settlement_negotiations', 'fee_payment', 'order_delivery', 'report_submission', 'witness_statement', 'medical_report', 'bail_status', 'other'],
    },
    followObjectDescription: {
      type: String,
      required: [true, 'Description is required'],
    },
    
    // EXPECTED DOCUMENT/ITEM
    expectedDeliverable: {
      name: String,
      description: String,
      format: {
        type: String,
        enum: ['physical', 'digital', 'both'],
      },
    },
    
    // DEADLINE & TIMING
    createdDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    
    // STATUS TRACKING
    status: {
      type: String,
      required: true,
      enum: ['pending', 'in_progress', 'done', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: String,
      },
    ],
    
    // OUTCOME/RESULT
    resultDetails: {
      resultDate: Date,
      resultSummary: String,
      resultDocuments: [
        {
          documentName: String,
          url: String,
          uploadedAt: Date,
        },
      ],
      successStatus: {
        type: String,
        enum: ['fully_received', 'partially_received', 'not_received', 'pending'],
      },
    },
    
    // AUTOMATION - REMINDERS
    reminders: {
      reminderBefore24Hours: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        reminderMessage: String,
      },
      reminderOnDeadlineDay: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
    },
    
    // AUTOMATION - AUTO-ESCALATION
    autoEscalation: {
      enabled: {
        type: Boolean,
        default: true,
      },
      escalatedDueToMissedDeadline: {
        type: Boolean,
        default: false,
      },
      escalationDate: Date,
      escalationReason: String,
    },
    
    // FOLLOW-UP ATTEMPTS
    followUpAttempts: [
      {
        attemptNumber: Number,
        attemptDate: Date,
        mode: {
          type: String,
          enum: ['call', 'email', 'whatsapp', 'sms', 'in_person', 'other'],
        },
        notes: String,
        outcome: String,
        nextFollowUpDate: Date,
        attemptBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    
    // ATTACHMENTS
    documents: [
      {
        documentName: String,
        url: String,
        documentType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // COST TRACKING (if any)
    estimatedCost: Number,
    actualCost: Number,
    costBreakdown: String,
    
    // METADATA
    internalNotes: String,
    relatedFollowUps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FollowUpDiary',
      },
    ],
    tags: [String],
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

// Indexes for efficient queries
followUpDiarySchema.index({ tenantId: 1, userId: 1 });
followUpDiarySchema.index({ deadline: 1 });
followUpDiarySchema.index({ status: 1 });
followUpDiarySchema.index({ caseId: 1 });
followUpDiarySchema.index({ priority: 1 });

module.exports = mongoose.model('FollowUpDiary', followUpDiarySchema);
