const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
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
    },
    documentType: {
      type: String,
      enum: ['bail_application', 'legal_notice', 'petition', 'Contract', 'Affidavit', 'Other'],
      required: [true, 'Document type is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
    },
    content: {
      type: String,
      required: false,
    },
    filePath: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    generatedByAI: {
      type: Boolean,
      default: true,
    },
    inputData: {
      facts: String,
      fir: String,
      clientDetails: String,
      additionalInfo: String,
    },
    metadata: {
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      model: {
        type: String,
        default: 'gemini-1.5-flash',
      },
      promptVersion: {
        type: String,
        default: '1.0',
      },
      uploadedAt: Date,
      originalName: String,
    },
    status: {
      type: String,
      enum: ['draft', 'finalized', 'archived'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    tags: [String],
    notes: String,
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
documentSchema.index({ tenantId: 1, caseId: 1 });
documentSchema.index({ tenantId: 1, documentType: 1 });
documentSchema.index({ createdBy: 1, createdAt: -1 });
documentSchema.index({ 'metadata.generatedAt': -1 });

module.exports = mongoose.model('Document', documentSchema);
