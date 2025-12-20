const mongoose = require('mongoose');

/**
 * Diary Entry Model
 * Simple diary entries for daily activities and notes
 */
const diaryEntrySchema = new mongoose.Schema(
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
    time: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    tags: [String],
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
diaryEntrySchema.index({ tenantId: 1, userId: 1, date: 1 });
diaryEntrySchema.index({ tenantId: 1, date: 1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
