const mongoose = require('mongoose');

/**
 * Confidential Lawyer Diary Model
 * 
 * A secret diary not visible to juniors or clerks.
 * Used for:
 * - Strategy
 * - High-profile clients
 * - Internal notes
 * - Password or biometric lock (handled at app level)
 */
const confidentialLawyerDiarySchema = new mongoose.Schema(
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
    
    // ONLY VISIBLE TO THE USER WHO CREATED IT (ENFORCED AT APP LEVEL)
    visibilityLevel: {
      type: String,
      enum: ['only_me', 'senior_advocates_only'],
      default: 'only_me',
    },
    
    // CAN SHARE WITH SPECIFIC SENIOR ADVOCATES
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: Date,
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permissions: {
          type: String,
          enum: ['view_only', 'edit', 'delete'],
          default: 'view_only',
        },
      },
    ],
    
    // ENTRY DETAILS
    entryTitle: {
      type: String,
      required: [true, 'Entry title is required'],
    },
    
    entryType: {
      type: String,
      required: [true, 'Entry type is required'],
      enum: ['case_strategy', 'client_confidential', 'legal_strategy', 'internal_notes', 'personal_reflections', 'risk_analysis', 'financial_notes', 'business_strategy', 'other'],
    },
    
    // RELATED ENTITIES
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
    
    // SENSITIVITY LEVEL
    sensitivityLevel: {
      type: String,
      required: true,
      enum: ['confidential', 'highly_confidential', 'top_secret'],
      default: 'confidential',
    },
    
    // CONTENT - CASE STRATEGY
    caseStrategy: {
      strategicApproach: String,
      strengths: [String],
      weaknesses: [String],
      risks: [String],
      opportunities: [String],
      contingencyPlans: [String],
      expectedOutcome: String,
      timelineStrategy: String,
      costBenefitAnalysis: String,
      riskMitigation: [String],
    },
    
    // CONTENT - CLIENT CONFIDENTIAL
    clientConfidentialNotes: {
      clientBehaviorAnalysis: String,
      clientCapabilities: String,
      clientLimitations: String,
      communicationStrategy: String,
      paymentReliability: String,
      trustLevel: {
        type: String,
        enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
      },
      specialConsiderations: String,
    },
    
    // CONTENT - LEGAL STRATEGY
    legalStrategy: {
      jurisprudentialApproach: String,
      precedentAnalysis: String,
      statutoryInterpretation: String,
      argumentHierarchy: [String],
      fallingBackPositions: [String],
      negotiationStrategy: String,
    },
    
    // CONTENT - INTERNAL NOTES
    internalNotes: {
      teamPerformance: String,
      resourceAllocation: String,
      outsourcingNeeds: String,
      expertConsultationNeeded: String,
    },
    
    // CONTENT - RISK ANALYSIS
    riskAnalysis: {
      caseRisks: [
        {
          riskDescription: String,
          probability: {
            type: String,
            enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
          },
          impact: {
            type: String,
            enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
          },
          mitigation: String,
        },
      ],
      financialRisks: String,
      reputationalRisks: String,
      ethicalConcerns: String,
    },
    
    // CONTENT - FINANCIAL NOTES
    financialNotes: {
      caseValueEstimate: Number,
      expectedFees: Number,
      risksToFeeCollection: String,
      profitMargin: String,
      otherMonetaryConsiderations: String,
    },
    
    // MAIN CONTENT
    entryContent: {
      type: String,
      required: [true, 'Entry content is required'],
    },
    
    // ATTACHMENTS (ENCRYPTED)
    attachments: [
      {
        fileName: String,
        fileType: String,
        url: String, // Stored securely
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
    
    // PASSWORD PROTECTION (ADDITIONAL SECURITY)
    passwordProtected: {
      type: Boolean,
      default: false,
    },
    
    // BIOMETRIC LOCK (FLAGGED FOR FRONTEND)
    biometricLockRequired: {
      type: Boolean,
      default: false,
    },
    
    // ENCRYPTION STATUS
    encrypted: {
      type: Boolean,
      default: true,
    },
    encryptionType: {
      type: String,
      default: 'AES-256',
    },
    
    // ACCESS LOG (AUDIT TRAIL)
    accessLog: [
      {
        accessedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        accessedAt: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          enum: ['view', 'edit', 'share', 'export'],
        },
        ipAddress: String,
        deviceInfo: String,
      },
    ],
    
    // EDIT TRACKING
    versions: [
      {
        versionNumber: Number,
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changeDescription: String,
      },
    ],
    
    // METADATA
    tags: [String],
    keywords: [String],
    
    // DELETION & RETENTION
    deleteAfterDays: Number, // Auto-delete after X days (optional)
    scheduledDeletionDate: Date,
    retentionRequired: {
      type: Boolean,
      default: true,
    },
    
    // STATUS & WORKFLOW
    status: {
      type: String,
      enum: ['draft', 'finalized', 'archived', 'deleted'],
      default: 'draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // METADATA
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
confidentialLawyerDiarySchema.index({ tenantId: 1, userId: 1 });
confidentialLawyerDiarySchema.index({ userId: 1 });
confidentialLawyerDiarySchema.index({ caseId: 1 });
confidentialLawyerDiarySchema.index({ sensitivityLevel: 1 });
confidentialLawyerDiarySchema.index({ createdAt: 1 });

// Ensure this is only accessed by the owner (enforce at route level too)
confidentialLawyerDiarySchema.pre('find', function () {
  // This will be enforced at controller level
});

module.exports = mongoose.model('ConfidentialLawyerDiary', confidentialLawyerDiarySchema);
