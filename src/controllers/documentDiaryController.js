const DocumentDiary = require('../models/DocumentDiary');
const Case = require('../models/Case');
const { sendEmail, sendSMS } = require('../utils/helpers');

/**
 * DOCUMENT DIARY CONTROLLER
 */

/**
 * CREATE Document Diary for a Case
 * @route POST /api/diary/document
 * @access ADVOCATE
 */
exports.createDocumentDiary = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      caseId,
      clientId,
      documentChecklist,
      automatedReminders,
      complianceRequired,
    } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required',
      });
    }

    const caseRecord = await Case.findById(caseId);
    if (!caseRecord || caseRecord.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    const documentDiary = new DocumentDiary({
      tenantId,
      caseId,
      clientId,
      caseNumber: caseRecord.caseNumber,
      caseTitle: caseRecord.title,
      documentChecklist: documentChecklist || [],
      automatedReminders: automatedReminders || {
        enabled: true,
        reminderSchedule: 'weekly',
        reminderDaysBeforeDue: 3,
        escalateIfNotReceived: true,
        escalationDaysAfterDue: 5,
      },
      complianceRequired: complianceRequired || false,
      createdBy: userId,
    });

    await documentDiary.save();

    res.status(201).json({
      success: true,
      message: 'Document diary created successfully',
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating document diary',
      error: error.message,
    });
  }
};

/**
 * GET Document Diary by Case
 * @route GET /api/diary/document/case/:caseId
 * @access ADVOCATE
 */
exports.getDocumentDiary = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;

    const documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    })
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName');

    if (!documentDiary) {
      return res.status(404).json({
        success: false,
        message: 'Document diary not found',
      });
    }

    res.json({
      success: true,
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching document diary',
      error: error.message,
    });
  }
};

/**
 * ADD DOCUMENT TO CHECKLIST
 * @route POST /api/diary/document/case/:caseId/checklist
 * @access ADVOCATE
 */
exports.addDocumentToChecklist = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;
    const {
      documentName,
      documentType,
      description,
      dueDate,
      priority,
      requiredFrom,
      requiredFromDetails,
    } = req.body;

    if (!documentName || !documentType || !requiredFrom) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    let documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    });

    if (!documentDiary) {
      return res.status(404).json({
        success: false,
        message: 'Document diary not found',
      });
    }

    // Add to checklist
    documentDiary.documentChecklist.push({
      documentName,
      documentType,
      description,
      dueDate,
      priority: priority || 'medium',
      requiredFrom,
      requiredFromDetails,
      status: 'pending',
    });

    // Update summary
    documentDiary.documentSummary = calculateDocumentSummary(documentDiary.documentChecklist);

    await documentDiary.save();

    res.json({
      success: true,
      message: 'Document added to checklist',
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding document',
      error: error.message,
    });
  }
};

/**
 * UPDATE DOCUMENT STATUS
 * @route PUT /api/diary/document/case/:caseId/checklist/:checklistId
 * @access ADVOCATE
 */
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { caseId, checklistId } = req.params;
    const { tenantId, userId } = req.user;
    const { status, verificationStatus, notes } = req.body;

    const documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    });

    if (!documentDiary) {
      return res.status(404).json({
        success: false,
        message: 'Document diary not found',
      });
    }

    const docItem = documentDiary.documentChecklist.id(checklistId);

    if (!docItem) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in checklist',
      });
    }

    // Update status
    docItem.status = status || docItem.status;
    docItem.statusUpdatedAt = new Date();
    docItem.statusUpdatedBy = userId;

    // Update verification
    if (verificationStatus) {
      docItem.verificationStatus = verificationStatus;
      docItem.verificationDetails = {
        verifiedBy: userId,
        verificationDate: new Date(),
        verificationNotes: notes,
        ...docItem.verificationDetails,
      };
    }

    // Update summary
    documentDiary.documentSummary = calculateDocumentSummary(documentDiary.documentChecklist);

    await documentDiary.save();

    res.json({
      success: true,
      message: 'Document status updated',
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating document status',
      error: error.message,
    });
  }
};

/**
 * UPLOAD DOCUMENT
 * @route POST /api/diary/document/case/:caseId/checklist/:checklistId/upload
 * @access ADVOCATE
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { caseId, checklistId } = req.params;
    const { tenantId, userId } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    });

    if (!documentDiary) {
      return res.status(404).json({
        success: false,
        message: 'Document diary not found',
      });
    }

    const docItem = documentDiary.documentChecklist.id(checklistId);

    if (!docItem) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in checklist',
      });
    }

    // Store document
    docItem.document = {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
      uploadedBy: userId,
    };

    docItem.status = 'received';
    docItem.statusUpdatedAt = new Date();

    // Update summary
    documentDiary.documentSummary = calculateDocumentSummary(documentDiary.documentChecklist);

    await documentDiary.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message,
    });
  }
};

/**
 * SEND REMINDER TO CLIENT FOR PENDING DOCUMENTS
 * @route POST /api/diary/document/case/:caseId/send-reminder
 * @access ADVOCATE
 */
exports.sendDocumentReminder = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;
    const { documentIds, mode } = req.body;

    const documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    }).populate('clientId', 'firstName lastName email phone');

    if (!documentDiary || !documentDiary.clientId) {
      return res.status(404).json({
        success: false,
        message: 'Document diary or client not found',
      });
    }

    const client = documentDiary.clientId;
    let sentCount = 0;

    // Filter pending documents
    const pendingDocs = documentDiary.documentChecklist.filter(
      (doc) => doc.status === 'pending' && (!documentIds || documentIds.includes(doc._id.toString()))
    );

    if (pendingDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending documents to remind about',
      });
    }

    const docNames = pendingDocs.map((d) => d.documentName).join(', ');
    const reminderMessage = `Please provide the following documents for your case ${documentDiary.caseNumber}: ${docNames}`;

    // Send email
    if ((mode === 'email' || mode === 'all') && client.email) {
      await sendEmail(
        client.email,
        `Document Reminder - ${documentDiary.caseNumber}`,
        reminderMessage
      );
      sentCount++;
    }

    // Send SMS
    if ((mode === 'sms' || mode === 'all') && client.phone) {
      await sendSMS(client.phone, reminderMessage);
      sentCount++;
    }

    // Update reminder status
    pendingDocs.forEach((doc) => {
      if (!doc.clientReminders) doc.clientReminders = [];

      doc.clientReminders.push({
        documentName: doc.documentName,
        reminderType: 'initial_request',
        reminderSent: true,
        reminderSentAt: new Date(),
        reminderMode: mode,
        reminderMessage,
      });
    });

    await documentDiary.save();

    res.json({
      success: true,
      message: `Reminders sent via ${sentCount} channel(s)`,
      docsReminded: pendingDocs.length,
      data: documentDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending reminder',
      error: error.message,
    });
  }
};

/**
 * AI VERIFY DOCUMENT
 * @route POST /api/diary/document/case/:caseId/checklist/:checklistId/ai-verify
 * @access ADVOCATE
 */
exports.aiVerifyDocument = async (req, res) => {
  try {
    const { caseId, checklistId } = req.params;
    const { tenantId } = req.user;

    const documentDiary = await DocumentDiary.findOne({
      tenantId,
      caseId,
    });

    if (!documentDiary) {
      return res.status(404).json({
        success: false,
        message: 'Document diary not found',
      });
    }

    const docItem = documentDiary.documentChecklist.id(checklistId);

    if (!docItem || !docItem.document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // TODO: Implement AI verification using Google Vision API or similar
    // This is a placeholder implementation
    docItem.aiVerification = {
      enabled: true,
      status: 'in_progress',
      verificationResults: {
        documentAuthenticity: 'pending',
        completenessScore: 0,
        requiredFieldsPresent: [],
        missingFields: [],
        anomalies: [],
        recommendation: 'Verification in progress...',
      },
    };

    await documentDiary.save();

    res.json({
      success: true,
      message: 'AI verification initiated',
      data: docItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying document',
      error: error.message,
    });
  }
};

/**
 * UTILITY FUNCTION
 */
function calculateDocumentSummary(documentChecklist) {
  const total = documentChecklist.length;
  const received = documentChecklist.filter((d) => d.status === 'received').length;
  const pending = documentChecklist.filter((d) => d.status === 'pending').length;
  const incomplete = documentChecklist.filter((d) => d.status === 'incomplete').length;

  return {
    totalRequired: total,
    totalReceived: received,
    totalPending: pending,
    totalIncomplete: incomplete,
    completionPercentage: total > 0 ? Math.round((received / total) * 100) : 0,
  };
}

module.exports = exports;
