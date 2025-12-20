const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },
    hearingDate: {
      type: Date,
      required: [true, 'Hearing date is required'],
      index: true,
    },
    hearingTime: String, // e.g., "10:30 AM"
    courtroom: String,
    judge: String,
    description: String,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
    reminderMethod: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'both',
    },
    status: {
      type: String,
      enum: ['scheduled', 'postponed', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    outcome: String,
    nextHearingDate: Date,
    notes: String,
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
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
hearingSchema.index({ tenantId: 1, hearingDate: 1 });
hearingSchema.index({ tenantId: 1, caseId: 1 });
hearingSchema.index({ tenantId: 1, reminderSent: 1 });

module.exports = mongoose.model('Hearing', hearingSchema);
