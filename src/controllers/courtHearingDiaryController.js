const CourtHearingDiary = require('../models/CourtHearingDiary');
const Client = require('../models/Client');
const Case = require('../models/Case');
const { sendNotification, sendSMS, sendEmail } = require('../utils/helpers');
const cronService = require('../services/cronService');

/**
 * COURT HEARING DIARY CONTROLLER
 */

/**
 * CREATE Court Hearing
 * @route POST /api/diary/court-hearing
 * @access ADVOCATE
 */
exports.createCourtHearing = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      caseId,
      clientId,
      caseTitle,
      caseNumber,
      court,
      judge,
      hearing,
      nextHearing,
      automation,
    } = req.body;

    // Validate required fields
    if (!caseTitle || !caseNumber || !court || !hearing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create court hearing diary
    const courtHearing = new CourtHearingDiary({
      tenantId,
      caseId,
      clientId,
      caseTitle,
      caseNumber,
      court,
      judge,
      hearing,
      nextHearing,
      automation: automation || {
        reminderBeforeHearing: {
          enabled: true,
          hoursBeforeHearing: 24,
        },
        autoClientNotification: {
          enabled: true,
          template: 'Next hearing of your case is on __.',
        },
      },
      createdBy: userId,
    });

    await courtHearing.save();

    // Schedule reminder if automation enabled
    if (automation?.reminderBeforeHearing?.enabled) {
      const reminderTime = new Date(hearing.date);
      reminderTime.setHours(
        reminderTime.getHours() - automation.reminderBeforeHearing.hoursBeforeHearing
      );
      // TODO: Schedule cron job for reminder
    }

    res.status(201).json({
      success: true,
      message: 'Court hearing created successfully',
      data: courtHearing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating court hearing',
      error: error.message,
    });
  }
};

/**
 * GET Court Hearing by ID
 * @route GET /api/diary/court-hearing/:id
 * @access ADVOCATE
 */
exports.getCourtHearing = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const courtHearing = await CourtHearingDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    if (!courtHearing || courtHearing.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Court hearing not found',
      });
    }

    res.json({
      success: true,
      data: courtHearing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching court hearing',
      error: error.message,
    });
  }
};

/**
 * GET All Court Hearings for a Case
 * @route GET /api/diary/court-hearing/case/:caseId
 * @access ADVOCATE
 */
exports.getCourtHearingsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;

    const hearings = await CourtHearingDiary.find({
      tenantId,
      caseId,
      isActive: true,
    })
      .sort({ 'hearing.date': -1 })
      .populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      count: hearings.length,
      data: hearings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching court hearings',
      error: error.message,
    });
  }
};

/**
 * UPDATE Court Hearing
 * @route PUT /api/diary/court-hearing/:id
 * @access ADVOCATE
 */
exports.updateCourtHearing = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const updates = req.body;

    const courtHearing = await CourtHearingDiary.findById(id);

    if (!courtHearing || courtHearing.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'hearing',
      'nextHearing',
      'outcome',
      'status',
      'priority',
      'advocateAttendance',
      'clientAttendance',
      'oppositeAdvocateName',
      'oppositeAdvocateAttendance',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        courtHearing[field] = updates[field];
      }
    });

    // If next hearing date is updated, send notification to client
    if (updates.nextHearing?.date && courtHearing.automation?.autoClientNotification?.enabled) {
      const client = await Client.findById(courtHearing.clientId);

      if (client) {
        const hearingDate = new Date(updates.nextHearing.date).toLocaleDateString();
        const message = `Next hearing of your case ${courtHearing.caseNumber} is on ${hearingDate}.`;

        // Send SMS
        if (client.phone) {
          await sendSMS(client.phone, message);
        }

        // Send Email
        if (client.email) {
          await sendEmail(client.email, 'Hearing Schedule Update', message);
        }

        courtHearing.automation.autoClientNotification.notificationSent = true;
        courtHearing.automation.autoClientNotification.notificationSentAt = new Date();
        courtHearing.automation.autoClientNotification.clientPhone = client.phone;
        courtHearing.automation.autoClientNotification.clientEmail = client.email;
      }
    }

    await courtHearing.save();

    res.json({
      success: true,
      message: 'Court hearing updated successfully',
      data: courtHearing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating court hearing',
      error: error.message,
    });
  }
};

/**
 * ADD HEARING OUTCOME
 * @route POST /api/diary/court-hearing/:id/outcome
 * @access ADVOCATE
 */
exports.addHearingOutcome = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const {
      orderDate,
      orderStatus,
      orderSummary,
      keyPoints,
      observationNotes,
    } = req.body;

    const courtHearing = await CourtHearingDiary.findById(id);

    if (!courtHearing || courtHearing.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Update outcome
    courtHearing.outcome = {
      orderDate,
      orderStatus,
      orderSummary,
      keyPoints: keyPoints || [],
      observationNotes,
      ...courtHearing.outcome,
    };

    courtHearing.status = 'completed';

    // Handle file uploads if provided
    if (req.files) {
      if (req.files.orderPDF) {
        courtHearing.outcome.orderPDF = {
          fileName: req.files.orderPDF[0].originalname,
          url: `/uploads/${req.files.orderPDF[0].filename}`,
          uploadedAt: new Date(),
        };
      }

      if (req.files.voiceNote) {
        courtHearing.outcome.voiceNote = {
          fileName: req.files.voiceNote[0].originalname,
          url: `/uploads/${req.files.voiceNote[0].filename}`,
          duration: 0, // Calculate from audio file
          uploadedAt: new Date(),
        };
      }
    }

    await courtHearing.save();

    res.json({
      success: true,
      message: 'Hearing outcome recorded successfully',
      data: courtHearing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording hearing outcome',
      error: error.message,
    });
  }
};

/**
 * DELETE Court Hearing (Soft Delete)
 * @route DELETE /api/diary/court-hearing/:id
 * @access ADVOCATE
 */
exports.deleteCourtHearing = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const courtHearing = await CourtHearingDiary.findById(id);

    if (!courtHearing || courtHearing.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    courtHearing.isActive = false;
    await courtHearing.save();

    res.json({
      success: true,
      message: 'Court hearing deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting court hearing',
      error: error.message,
    });
  }
};

/**
 * GET UPCOMING HEARINGS FOR TODAY
 * @route GET /api/diary/court-hearing/today/upcoming
 * @access ADVOCATE
 */
exports.getTodayHearings = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hearings = await CourtHearingDiary.find({
      tenantId,
      'hearing.date': {
        $gte: today,
        $lt: tomorrow,
      },
      status: { $ne: 'cancelled' },
    })
      .populate('clientId', 'firstName lastName phone email')
      .populate('caseId', 'caseNumber title');

    res.json({
      success: true,
      count: hearings.length,
      data: hearings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today hearings',
      error: error.message,
    });
  }
};

module.exports = exports;
