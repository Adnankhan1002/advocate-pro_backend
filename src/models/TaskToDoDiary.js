const mongoose = require('mongoose');

/**
 * Task & To-Do Diary Model
 * 
 * Features:
 * - Create tasks for team members
 * - Assign to juniors/clerks
 * - Set deadlines
 * - Attach documents
 * - Track progress
 */
const taskToDoDiarySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // TASK DETAILS
    title: {
      type: String,
      required: [true, 'Task title is required'],
    },
    description: String,
    
    // TASK TYPE
    taskType: {
      type: String,
      enum: ['legal_research', 'document_drafting', 'case_analysis', 'client_follow_up', 'fee_collection', 'court_filing', 'meeting_preparation', 'administrative', 'other'],
      required: true,
    },
    
    // RELATED CASE & CLIENT
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
    
    // ASSIGNMENT
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to someone'],
      index: true,
    },
    assignedToDetails: {
      name: String,
      role: {
        type: String,
        enum: ['junior_advocate', 'clerk', 'staff', 'other'],
      },
      email: String,
      phone: String,
    },
    assignmentDate: {
      type: Date,
      default: Date.now,
    },
    
    // DEADLINE & PRIORITY
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    estimatedTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours',
      },
    },
    
    // TASK PROGRESS
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'],
      default: 'pending',
      index: true,
    },
    
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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
    
    // CHECKLIST/SUBTASKS
    subtasks: [
      {
        subtaskId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        order: Number,
      },
    ],
    
    // ATTACHMENTS & DOCUMENTS
    attachedDocuments: [
      {
        documentName: String,
        documentType: String,
        description: String,
        url: String,
        fileSize: Number, // in bytes
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // OUTPUT/SUBMISSION
    submissionDetails: {
      submittedDate: Date,
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      submissionNotes: String,
      submissionFiles: [
        {
          fileName: String,
          url: String,
          uploadedAt: Date,
        },
      ],
    },
    
    // APPROVAL/REVIEW
    reviewRequired: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewDate: Date,
    reviewStatus: {
      type: String,
      enum: ['pending_review', 'approved', 'needs_revision', 'rejected'],
    },
    reviewComments: String,
    
    // REMINDERS
    reminders: {
      reminderBefore1Day: {
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
      reminderBefore2Hours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
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
    
    // DEPENDENCIES
    dependsOnTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskToDoDiary',
      },
    ],
    blockedByTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskToDoDiary',
      },
    ],
    
    // COMMENTS & COLLABORATION
    comments: [
      {
        commentId: mongoose.Schema.Types.ObjectId,
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        commentText: String,
        attachments: [
          {
            fileName: String,
            url: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    
    // TIME TRACKING
    actualTimeSpent: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
      },
    },
    timeEntries: [
      {
        entryDate: Date,
        timeSpent: Number, // in minutes
        description: String,
        loggedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    
    // METADATA
    tags: [String],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly'],
    },
    recurringUntil: Date,
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskToDoDiary',
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

// Indexes
taskToDoDiarySchema.index({ tenantId: 1 });
taskToDoDiarySchema.index({ assignedTo: 1 });
taskToDoDiarySchema.index({ deadline: 1 });
taskToDoDiarySchema.index({ status: 1 });
taskToDoDiarySchema.index({ priority: 1 });
taskToDoDiarySchema.index({ caseId: 1 });

module.exports = mongoose.model('TaskToDoDiary', taskToDoDiarySchema);
