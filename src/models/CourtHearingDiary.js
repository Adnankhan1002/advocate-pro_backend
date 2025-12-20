const mongoose = require('mongoose');

/**
 * Court Hearing Diary Model
 * Specialized diary for court matters only
 * 
 * Tracks:
 * - Court details
 * - Hearing information
 * - Judge info
 * - Case stage
 * - Hearing outcomes
 * - Automatic reminders
 * - Client notifications
 */
const courtHearingDiarySchema = new mongoose.Schema(
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
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    
    // CASE INFORMATION
    caseTitle: {
      type: String,
      required: [true, 'Case title is required'],
      // e.g., "State v/s X" or "ABC v/s XYZ"
    },
    caseNumber: {
      type: String,
      required: true,
    },
    
    // COURT DETAILS
    court: {
      name: {
        type: String,
        required: [true, 'Court name is required'],
        enum: ['District Court', 'High Court', 'Supreme Court', 'Tribunal', 'Consumer Court', 'Labor Court', 'Other'],
      },
      location: String,
      jurisdiction: String,
      benchNumber: String,
    },
    
    // JUDGE INFORMATION
    judge: {
      name: String,
      court: String,
      benchNumber: String,
    },
    
    // HEARING DETAILS
    hearing: {
      date: {
        type: Date,
        required: [true, 'Hearing date is required'],
        index: true,
      },
      time: String, // e.g., "10:30 AM"
      courtRoom: String,
      itemNo: String, // Item number in cause list
      purposeOfHearing: {
        type: String,
        enum: ['Evidence', 'Cross-examination', 'Arguments', 'Interim Order', 'Final Order', 'Status Update', 'Motion', 'Other'],
        required: true,
      },
      caseStage: {
        type: String,
        enum: ['Admission', 'Evidence', 'Cross', 'Arguments', 'Judgment', 'Post-Judgment', 'Appeal', 'Other'],
      },
      expectedOutcome: String,
    },
    
    // NEXT HEARING
    nextHearing: {
      date: Date,
      time: String,
      purpose: String,
      expectedStage: String,
      notificationSent: {
        type: Boolean,
        default: false,
      },
      notificationSentAt: Date,
    },
    
    // HEARING OUTCOME/NOTES
    outcome: {
      orderDate: Date,
      orderStatus: {
        type: String,
        enum: ['reserved', 'pronounced', 'pending', 'not_delivered'],
      },
      orderSummary: String,
      keyPoints: [String],
      orderPDF: {
        fileName: String,
        url: String,
        uploadedAt: Date,
      },
      voiceNote: {
        fileName: String,
        url: String,
        duration: Number, // in seconds
        uploadedAt: Date,
      },
      observationNotes: String,
    },
    
    // AUTOMATION SETTINGS
    automation: {
      reminderBeforeHearing: {
        enabled: {
          type: Boolean,
          default: true,
        },
        hoursBeforeHearing: {
          type: Number,
          default: 24,
        },
      },
      autoClientNotification: {
        enabled: {
          type: Boolean,
          default: true,
        },
        template: {
          type: String,
          default: 'Next hearing of your case is on __.',
        },
        notificationSent: {
          type: Boolean,
          default: false,
        },
        notificationSentAt: Date,
        clientPhone: String,
        clientEmail: String,
      },
    },
    
    // ATTENDANCE & MARKS
    advocateAttendance: {
      present: {
        type: Boolean,
        default: true,
      },
      remarks: String,
    },
    
    clientAttendance: {
      present: Boolean,
      remarks: String,
    },
    
    oppositeAdvocateName: String,
    oppositeAdvocateAttendance: {
      present: Boolean,
      remarks: String,
    },
    
    // DOCUMENTS & ARTIFACTS
    documents: [
      {
        documentName: String,
        documentType: {
          type: String,
          enum: ['order', 'cause_list', 'summons', 'notice', 'petition', 'other'],
        },
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // NEXT ACTIONS
    nextActions: [
      {
        action: String,
        dueDate: Date,
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          default: 'pending',
        },
      },
    ],
    
    // STATUS & METADATA
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'adjourned'],
      default: 'scheduled',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
courtHearingDiarySchema.index({ tenantId: 1, caseId: 1 });
courtHearingDiarySchema.index({ 'hearing.date': 1 });
courtHearingDiarySchema.index({ clientId: 1 });

module.exports = mongoose.model('CourtHearingDiary', courtHearingDiarySchema);
