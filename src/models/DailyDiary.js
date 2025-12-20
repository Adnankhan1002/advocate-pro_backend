const mongoose = require('mongoose');

/**
 * Daily Diary Model
 * Stores today's critical information:
 * - Hearings
 * - Client meetings
 * - Follow-ups
 * - Tasks
 * - Deadlines
 */
const dailyDiarySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    
    // TODAY'S HEARINGS
    hearings: [
      {
        hearingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CourtHearingDiary',
        },
        caseTitle: String,
        courtName: String,
        courtRoom: String,
        itemNo: String,
        time: Date,
        priority: {
          type: String,
          enum: ['red', 'yellow', 'green'],
          default: 'green',
        },
        status: {
          type: String,
          enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
          default: 'scheduled',
        },
      },
    ],
    
    // TODAY'S CLIENT MEETINGS
    clientMeetings: [
      {
        meetingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PersonalClientMeetingDiary',
        },
        clientName: String,
        purpose: String,
        time: Date,
        mode: {
          type: String,
          enum: ['office', 'phone', 'video_call', 'court_meeting'],
        },
        priority: {
          type: String,
          enum: ['red', 'yellow', 'green'],
          default: 'green',
        },
      },
    ],
    
    // TODAY'S FOLLOW-UPS
    followUps: [
      {
        followUpId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FollowUpDiary',
        },
        followTarget: String,
        followObject: String,
        deadline: Date,
        status: {
          type: String,
          enum: ['pending', 'done'],
          default: 'pending',
        },
        priority: {
          type: String,
          enum: ['red', 'yellow', 'green'],
          default: 'green',
        },
      },
    ],
    
    // TODAY'S TASKS
    tasks: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaskToDoDiary',
        },
        title: String,
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        deadline: Date,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'done'],
          default: 'pending',
        },
        priority: {
          type: String,
          enum: ['red', 'yellow', 'green'],
          default: 'green',
        },
      },
    ],
    
    // IMPORTANT DEADLINES
    deadlines: [
      {
        title: String,
        caseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Case',
        },
        dueDate: Date,
        description: String,
        priority: {
          type: String,
          enum: ['red', 'yellow', 'green'],
          default: 'green',
        },
        type: {
          type: String,
          enum: ['filing', 'submission', 'hearing', 'response', 'payment', 'other'],
        },
      },
    ],
    
    // ALERTS FOR MATTERS NEEDING ATTENTION
    alerts: [
      {
        type: {
          type: String,
          enum: ['case_limitation', 'missed_deadline', 'pending_document', 'overdue_follow_up', 'payment_pending', 'hearing_reminder'],
        },
        message: String,
        relatedEntity: {
          type: String,
          enum: ['case', 'hearing', 'follow_up', 'task', 'client'],
        },
        relatedId: mongoose.Schema.Types.ObjectId,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedAt: Date,
      },
    ],
    
    // METADATA
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
    calendarSync: {
      googleCalendar: {
        synced: Boolean,
        lastSyncAt: Date,
        externalId: String,
      },
      outlookCalendar: {
        synced: Boolean,
        lastSyncAt: Date,
        externalId: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
dailyDiarySchema.index({ tenantId: 1, userId: 1, date: 1 }, { unique: true });
dailyDiarySchema.index({ date: 1 });

module.exports = mongoose.model('DailyDiary', dailyDiarySchema);
