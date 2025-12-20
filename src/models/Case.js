const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      unique: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
    },
    description: String,
    caseType: {
      type: String,
      enum: [
        'civil',
        'criminal',
        'family',
        'corporate',
        'property',
        'labor',
        'tax',
        'intellectual_property',
        'other',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed', 'on_hold', 'archived'],
      default: 'open',
    },
    court: {
      name: String,
      location: String,
      jurisdiction: String,
    },
    judge: String,
    oppositeParty: String,
    oppositeAdvocate: String,
    filingDate: Date,
    nextHearingDate: Date,
    budget: {
      type: Number,
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
    documents: [
      {
        name: String,
        url: String,
        type: String, // pdf, image, word, etc.
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: String,
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
caseSchema.index({ tenantId: 1, caseNumber: 1 }, { unique: true });
caseSchema.index({ tenantId: 1, status: 1 });
caseSchema.index({ tenantId: 1, clientId: 1 });
caseSchema.index({ nextHearingDate: 1 });

module.exports = mongoose.model('Case', caseSchema);
