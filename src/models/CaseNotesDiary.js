const mongoose = require('mongoose');

/**
 * Case Notes Diary Model
 * 
 * Every case gets its own mini diary.
 * Includes:
 * - Strategy notes
 * - Opponent arguments
 * - Research points
 * - Evidence notes
 * - Legal citations
 * - Witness preparation notes
 * - Handwritten notes as images
 */
const caseNotesDiarySchema = new mongoose.Schema(
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
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // CASE INFORMATION
    caseNumber: {
      type: String,
      required: true,
    },
    caseTitle: {
      type: String,
      required: true,
    },
    
    // NOTES ENTRY
    noteTitle: {
      type: String,
      required: [true, 'Note title is required'],
    },
    
    // NOTES CATEGORY
    category: {
      type: String,
      required: [true, 'Note category is required'],
      enum: ['strategy', 'opponent_arguments', 'research_points', 'evidence_notes', 'legal_citations', 'witness_preparation', 'hearing_observations', 'judgment_analysis', 'client_notes', 'general_notes'],
    },
    
    // STRATEGY NOTES
    strategy: {
      strategicApproach: String,
      keyArguments: [String],
      weaknesses: [String],
      strengths: [String],
      risks: [String],
      opportunities: [String],
    },
    
    // OPPONENT ARGUMENTS
    opponentInfo: {
      advocateName: String,
      advocateContactDetails: String,
      previousArguments: [String],
      likelyCounterArguments: [String],
      opponentWeaknesses: [String],
      strategyToCounter: String,
    },
    
    // RESEARCH POINTS
    research: {
      researchTopic: String,
      relevantLaws: [
        {
          actName: String,
          sections: [String],
          relevance: String,
          caseLaw: [
            {
              caseName: String,
              citation: String,
              year: Number,
              relevantHolding: String,
            },
          ],
        },
      ],
      precedents: [
        {
          caseName: String,
          courtName: String,
          year: Number,
          citation: String,
          applicability: String,
        },
      ],
      researchLinks: [String],
    },
    
    // EVIDENCE NOTES
    evidence: {
      evidenceType: {
        type: String,
        enum: ['documentary', 'oral', 'expert', 'physical'],
      },
      evidenceDescription: String,
      evidenceName: String,
      relevantTo: String, // which point it proves
      location: String, // where it is stored/filed
      status: {
        type: String,
        enum: ['pending', 'collected', 'submitted', 'rejected'],
      },
      importance: {
        type: String,
        enum: ['critical', 'important', 'supporting', 'background'],
      },
    },
    
    // LEGAL CITATIONS
    citations: [
      {
        citationNumber: Number,
        citeType: {
          type: String,
          enum: ['statute', 'case_law', 'rule', 'regulation', 'judicial_precedent'],
        },
        citedWork: String, // Act, Case name, etc.
        section: String,
        page: String,
        relevantQuote: String,
        applicationToCase: String,
        sourceUrl: String,
      },
    ],
    
    // WITNESS PREPARATION NOTES
    witnessPreparation: {
      witnessName: String,
      witnessRole: {
        type: String,
        enum: ['primary', 'supporting', 'expert', 'hostile'],
      },
      witnessPhone: String,
      witnessEmail: String,
      contactAddress: String,
      availabilityForHearing: String,
      preparationStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'prepared', 'ready_for_examination'],
        default: 'not_started',
      },
      keyPointsToEmphasize: [String],
      possibleCrossExamQuestions: [String],
      witnessPreparationMeetings: [
        {
          meetingDate: Date,
          meetingNotes: String,
          preparedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
    },
    
    // HEARING OBSERVATIONS
    hearingObservations: {
      hearingDate: Date,
      judgeObservations: String,
      oppositeAdvocatePerformance: String,
      judgeLineOfQuestioning: String,
      positiveSigns: [String],
      concerns: [String],
      nextExpectedLineOfArgument: String,
    },
    
    // JUDGMENT ANALYSIS
    judgmentAnalysis: {
      judgmentDate: Date,
      judgmentCopy: {
        fileName: String,
        url: String,
      },
      judgmentSummary: String,
      keyHoldings: [String],
      reasoningAnalysis: String,
      implications: [String],
      appealPossibility: String,
      appealStrategy: String,
    },
    
    // MAIN NOTE CONTENT
    noteContent: {
      type: String,
      required: [true, 'Note content is required'],
    },
    
    // ATTACHMENTS
    attachments: [
      {
        attachmentType: {
          type: String,
          enum: ['image', 'pdf', 'document', 'audio', 'video', 'handwritten_note'],
        },
        fileName: String,
        url: String,
        description: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    
    // HANDWRITTEN NOTES
    handwrittenNotes: [
      {
        imageName: String,
        imageUrl: String,
        transcription: String, // OCR-based transcription
        dateTaken: Date,
        description: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // TAGS & METADATA
    tags: [String],
    keywords: [String],
    
    // LINKED REFERENCES
    linkedNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CaseNotesDiary',
      },
    ],
    linkedDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    
    // PRIORITY & VISIBILITY
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    visibility: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'private',
    },
    visibleTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    
    // UPDATES & REVISIONS
    versions: [
      {
        versionNumber: Number,
        content: String,
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changeDescription: String,
      },
    ],
    
    // STATUS
    status: {
      type: String,
      enum: ['draft', 'finalized', 'archived'],
      default: 'draft',
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
caseNotesDiarySchema.index({ tenantId: 1, caseId: 1 });
caseNotesDiarySchema.index({ caseId: 1 });
caseNotesDiarySchema.index({ userId: 1 });
caseNotesDiarySchema.index({ category: 1 });
caseNotesDiarySchema.index({ tags: 1 });

module.exports = mongoose.model('CaseNotesDiary', caseNotesDiarySchema);
