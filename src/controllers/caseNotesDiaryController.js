const CaseNotesDiary = require('../models/CaseNotesDiary');
const Case = require('../models/Case');

/**
 * CASE NOTES DIARY CONTROLLER
 */

/**
 * CREATE Case Note
 * @route POST /api/diary/case-notes
 * @access ADVOCATE
 */
exports.createCaseNote = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      caseId,
      noteTitle,
      category,
      noteContent,
      strategy,
      opponentInfo,
      research,
      evidence,
      citations,
      witnessPreparation,
      hearingObservations,
      judgmentAnalysis,
      tags,
      visibility,
      visibleTo,
    } = req.body;

    if (!caseId || !noteTitle || !category || !noteContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get case details
    const caseRecord = await Case.findById(caseId);
    if (!caseRecord || caseRecord.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    const caseNote = new CaseNotesDiary({
      tenantId,
      caseId,
      userId,
      caseNumber: caseRecord.caseNumber,
      caseTitle: caseRecord.title,
      noteTitle,
      category,
      noteContent,
      strategy,
      opponentInfo,
      research,
      evidence,
      citations,
      witnessPreparation,
      hearingObservations,
      judgmentAnalysis,
      tags: tags || [],
      visibility: visibility || 'private',
      visibleTo: visibleTo || [],
      createdBy: userId,
      status: 'draft',
    });

    await caseNote.save();

    res.status(201).json({
      success: true,
      message: 'Case note created successfully',
      data: caseNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating case note',
      error: error.message,
    });
  }
};

/**
 * GET Case Note by ID
 * @route GET /api/diary/case-notes/:id
 * @access ADVOCATE
 */
exports.getCaseNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    const caseNote = await CaseNotesDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('createdBy', 'firstName lastName email');

    if (!caseNote || caseNote.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Case note not found',
      });
    }

    // Check visibility
    if (caseNote.visibility === 'private' && caseNote.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this note',
      });
    }

    if (
      caseNote.visibility === 'team' &&
      !caseNote.visibleTo.includes(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this note',
      });
    }

    res.json({
      success: true,
      data: caseNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching case note',
      error: error.message,
    });
  }
};

/**
 * GET All Case Notes for a Case
 * @route GET /api/diary/case-notes/case/:caseId
 * @access ADVOCATE
 */
exports.getCaseNotesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId, userId } = req.user;

    const notes = await CaseNotesDiary.find({
      tenantId,
      caseId,
      isActive: true,
      $or: [
        { visibility: 'public' },
        { createdBy: userId },
        { visibleTo: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching case notes',
      error: error.message,
    });
  }
};

/**
 * UPDATE Case Note
 * @route PUT /api/diary/case-notes/:id
 * @access ADVOCATE
 */
exports.updateCaseNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const updates = req.body;

    const caseNote = await CaseNotesDiary.findById(id);

    if (!caseNote || caseNote.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only creator or with explicit edit permission can update
    if (caseNote.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only creator can update this note',
      });
    }

    // Save version history
    if (caseNote.noteContent !== updates.noteContent) {
      caseNote.versions.push({
        versionNumber: caseNote.versions.length + 1,
        content: caseNote.noteContent,
        modifiedAt: new Date(),
        modifiedBy: userId,
        changeDescription: updates.changeDescription || 'Content updated',
      });
    }

    const allowedUpdates = [
      'noteTitle',
      'noteContent',
      'category',
      'strategy',
      'opponentInfo',
      'research',
      'evidence',
      'citations',
      'witnessPreparation',
      'hearingObservations',
      'judgmentAnalysis',
      'tags',
      'visibility',
      'visibleTo',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        caseNote[field] = updates[field];
      }
    });

    await caseNote.save();

    res.json({
      success: true,
      message: 'Case note updated successfully',
      data: caseNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating case note',
      error: error.message,
    });
  }
};

/**
 * ADD ATTACHMENT TO CASE NOTE
 * @route POST /api/diary/case-notes/:id/attachment
 * @access ADVOCATE
 */
exports.addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const caseNote = await CaseNotesDiary.findById(id);

    if (!caseNote || caseNote.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    caseNote.attachments.push({
      attachmentType: req.body.attachmentType || 'document',
      fileName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      description: req.body.description,
      uploadedAt: new Date(),
      uploadedBy: req.user.userId,
    });

    await caseNote.save();

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: caseNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding attachment',
      error: error.message,
    });
  }
};

/**
 * ADD HANDWRITTEN NOTE (IMAGE)
 * @route POST /api/diary/case-notes/:id/handwritten
 * @access ADVOCATE
 */
exports.addHandwrittenNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const caseNote = await CaseNotesDiary.findById(id);

    if (!caseNote || caseNote.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // TODO: Implement OCR transcription using Google Vision API or similar
    caseNote.handwrittenNotes.push({
      imageName: req.file.originalname,
      imageUrl: `/uploads/${req.file.filename}`,
      transcription: req.body.transcription || '', // Will be auto-filled with OCR
      dateTaken: new Date(req.body.dateTaken) || new Date(),
      description: req.body.description,
      uploadedAt: new Date(),
    });

    await caseNote.save();

    res.json({
      success: true,
      message: 'Handwritten note added successfully',
      data: caseNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding handwritten note',
      error: error.message,
    });
  }
};

/**
 * SEARCH CASE NOTES BY TAGS OR KEYWORDS
 * @route GET /api/diary/case-notes/search
 * @access ADVOCATE
 */
exports.searchCaseNotes = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { query, caseId, category } = req.query;

    const searchQuery = {
      tenantId,
      isActive: true,
      $or: [
        { visibility: 'public' },
        { createdBy: userId },
        { visibleTo: userId },
      ],
    };

    if (query) {
      searchQuery.$or = [
        { noteTitle: { $regex: query, $options: 'i' } },
        { noteContent: { $regex: query, $options: 'i' } },
        { tags: { $in: [query] } },
        { keywords: { $in: [query] } },
      ];
    }

    if (caseId) searchQuery.caseId = caseId;
    if (category) searchQuery.category = category;

    const notes = await CaseNotesDiary.find(searchQuery)
      .limit(20)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching case notes',
      error: error.message,
    });
  }
};

/**
 * DELETE Case Note (Soft Delete)
 * @route DELETE /api/diary/case-notes/:id
 * @access ADVOCATE
 */
exports.deleteCaseNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const caseNote = await CaseNotesDiary.findById(id);

    if (!caseNote || caseNote.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    caseNote.isActive = false;
    await caseNote.save();

    res.json({
      success: true,
      message: 'Case note deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting case note',
      error: error.message,
    });
  }
};

module.exports = exports;
