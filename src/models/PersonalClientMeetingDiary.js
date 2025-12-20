const mongoose = require('mongoose');

/**
 * Personal & Client Meeting Diary Model
 * 
 * Tracks all types of discussions and meetings:
 * - Client meetings
 * - Staff meetings
 * - Court meetings
 * - Phone calls
 * - Video calls
 */
const personalClientMeetingDiarySchema = new mongoose.Schema(
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
    },
    
    // MEETING DETAILS
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
    },
    
    // MEETING PURPOSE & TYPE
    purpose: {
      type: String,
      required: [true, 'Meeting purpose is required'],
      enum: ['case_discussion', 'legal_advice', 'document_review', 'fee_discussion', 'progress_update', 'retainer', 'follow_up', 'other'],
    },
    description: String,
    
    // TIMING
    meetingDate: {
      type: Date,
      required: [true, 'Meeting date is required'],
      index: true,
    },
    startTime: String, // e.g., "10:30 AM"
    endTime: String,
    duration: Number, // in minutes
    
    // MEETING MODE
    mode: {
      type: String,
      required: [true, 'Meeting mode is required'],
      enum: ['office', 'phone', 'video_call', 'court_meeting', 'online_meeting'],
    },
    
    // MODE-SPECIFIC DETAILS
    modeDetails: {
      office: {
        location: String,
        roomNumber: String,
      },
      phone: {
        phoneNumber: String,
        notes: String,
      },
      videoCall: {
        platform: String, // Zoom, Teams, Google Meet, etc.
        meetingLink: String,
        recordingUrl: String,
      },
      courtMeeting: {
        courtName: String,
        caseNumber: String,
        otherParties: [String],
      },
    },
    
    // RELATED CASE
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    caseNumber: String,
    
    // MEETING NOTES
    notes: {
      mainPoints: [String],
      decisionsReached: [String],
      clientConcerns: String,
      advocateAdvice: String,
      actionItems: [
        {
          item: String,
          owner: {
            type: String,
            enum: ['client', 'advocate', 'both'],
          },
          dueDate: Date,
          status: {
            type: String,
            enum: ['pending', 'completed', 'pending_from_client'],
            default: 'pending',
          },
        },
      ],
    },
    
    // ATTACHMENTS & VOICE NOTES
    documents: [
      {
        documentName: String,
        documentType: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    voiceNotes: [
      {
        fileName: String,
        url: String,
        duration: Number, // in seconds
        transcription: String, // AI transcription (optional)
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // FOLLOW-UP REMINDER
    followUpReminder: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderDate: Date,
      reminderType: {
        type: String,
        enum: ['email', 'sms', 'in_app', 'all'],
        default: 'in_app',
      },
      reminderSent: {
        type: Boolean,
        default: false,
      },
      reminderSentAt: Date,
      reminderMessage: String,
    },
    
    // FEE & PAYMENT
    feesDiscussed: Number,
    paymentMode: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'pending', 'not_discussed'],
    },
    amountReceivedInMeeting: Number,
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    
    // ATTENDANCE
    clientAttendance: {
      type: String,
      enum: ['present', 'absent', 'late', 'cancelled'],
      default: 'present',
    },
    attendees: [
      {
        name: String,
        role: String, // client, junior advocate, clerk, etc.
        email: String,
        phone: String,
      },
    ],
    
    // METADATA
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    confidentiality: {
      type: String,
      enum: ['public', 'private', 'highly_confidential'],
      default: 'private',
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
personalClientMeetingDiarySchema.index({ tenantId: 1, userId: 1 });
personalClientMeetingDiarySchema.index({ meetingDate: 1 });
personalClientMeetingDiarySchema.index({ clientId: 1 });
personalClientMeetingDiarySchema.index({ caseId: 1 });

module.exports = mongoose.model('PersonalClientMeetingDiary', personalClientMeetingDiarySchema);
