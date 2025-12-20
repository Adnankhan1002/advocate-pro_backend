const FollowUpDiary = require('../models/FollowUpDiary');
const { sendEmail, sendSMS, sendNotification } = require('../utils/helpers');

/**
 * FOLLOW-UP DIARY CONTROLLER
 */

/**
 * CREATE Follow-Up Entry
 * @route POST /api/diary/follow-up
 * @access ADVOCATE
 */
exports.createFollowUp = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      caseId,
      clientId,
      followTarget,
      followTargetDetails,
      followObject,
      followObjectDescription,
      expectedDeliverable,
      deadline,
      priority,
      internalNotes,
      documents,
    } = req.body;

    if (!followTarget || !followObject || !followObjectDescription || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const followUp = new FollowUpDiary({
      tenantId,
      userId,
      caseId,
      clientId,
      followTarget,
      followTargetDetails,
      followObject,
      followObjectDescription,
      expectedDeliverable,
      deadline,
      priority: priority || 'medium',
      status: 'pending',
      internalNotes,
      documents,
      createdBy: userId,
    });

    await followUp.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up entry created successfully',
      data: followUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating follow-up entry',
      error: error.message,
    });
  }
};

/**
 * GET Follow-Up by ID
 * @route GET /api/diary/follow-up/:id
 * @access ADVOCATE
 */
exports.getFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const followUp = await FollowUpDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    if (!followUp || followUp.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found',
      });
    }

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-up',
      error: error.message,
    });
  }
};

/**
 * GET All Follow-Ups for User (with filters)
 * @route GET /api/diary/follow-up
 * @access ADVOCATE
 */
exports.getAllFollowUps = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { status, priority, daysOverdue } = req.query;

    const query = {
      tenantId,
      userId,
      isActive: true,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Get overdue follow-ups
    if (daysOverdue) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(daysOverdue));
      query.deadline = { $lt: daysAgo };
    }

    const followUps = await FollowUpDiary.find(query)
      .sort({ deadline: 1 })
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-ups',
      error: error.message,
    });
  }
};

/**
 * UPDATE Follow-Up
 * @route PUT /api/diary/follow-up/:id
 * @access ADVOCATE
 */
exports.updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const updates = req.body;

    const followUp = await FollowUpDiary.findById(id);

    if (!followUp || followUp.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Update status with history
    if (updates.status && updates.status !== followUp.status) {
      followUp.statusHistory.push({
        status: updates.status,
        changedAt: new Date(),
        changedBy: req.user.userId,
        notes: updates.statusChangeNotes || '',
      });

      // Check if escalation needed
      if (updates.status === 'pending' && new Date() > followUp.deadline) {
        followUp.autoEscalation.escalatedDueToMissedDeadline = true;
        followUp.autoEscalation.escalationDate = new Date();
        followUp.autoEscalation.escalationReason = 'Missed deadline';
        followUp.priority = 'urgent';
      }
    }

    // Update result if status is done
    if (updates.status === 'done') {
      followUp.resultDetails = {
        resultDate: new Date(),
        resultSummary: updates.resultSummary || '',
        ...followUp.resultDetails,
      };
    }

    const allowedUpdates = [
      'followTarget',
      'followTargetDetails',
      'followObject',
      'followObjectDescription',
      'deadline',
      'priority',
      'status',
      'resultDetails',
      'internalNotes',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined && field !== 'status') {
        followUp[field] = updates[field];
      }
    });

    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating follow-up',
      error: error.message,
    });
  }
};

/**
 * LOG FOLLOW-UP ATTEMPT
 * @route POST /api/diary/follow-up/:id/attempt
 * @access ADVOCATE
 */
exports.logFollowUpAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { mode, notes, outcome, nextFollowUpDate } = req.body;

    const followUp = await FollowUpDiary.findById(id);

    if (!followUp || followUp.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const attemptNumber = followUp.followUpAttempts.length + 1;

    followUp.followUpAttempts.push({
      attemptNumber,
      attemptDate: new Date(),
      mode,
      notes,
      outcome,
      nextFollowUpDate,
      attemptBy: userId,
    });

    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up attempt logged successfully',
      data: followUp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging follow-up attempt',
      error: error.message,
    });
  }
};

/**
 * SEND REMINDER
 * @route POST /api/diary/follow-up/:id/send-reminder
 * @access ADVOCATE
 */
exports.sendFollowUpReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const { mode } = req.body;

    const followUp = await FollowUpDiary.findById(id)
      .populate('followTargetDetails')
      .populate('followTargetDetails.email');

    if (!followUp || followUp.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    let reminderSent = false;
    const reminderMessage = `Reminder: Follow-up needed for ${followUp.followObject} - Deadline: ${followUp.deadline.toDateString()}`;

    if ((mode === 'email' || mode === 'all') && followUp.followTargetDetails?.email) {
      await sendEmail(
        followUp.followTargetDetails.email,
        'Follow-up Reminder',
        reminderMessage
      );
      reminderSent = true;
    }

    if ((mode === 'sms' || mode === 'all') && followUp.followTargetDetails?.phone) {
      await sendSMS(followUp.followTargetDetails.phone, reminderMessage);
      reminderSent = true;
    }

    if (reminderSent) {
      followUp.reminders.reminderBefore24Hours.sent = true;
      followUp.reminders.reminderBefore24Hours.sentAt = new Date();
      await followUp.save();
    }

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      data: followUp,
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
 * GET OVERDUE FOLLOW-UPS
 * @route GET /api/diary/follow-up/overdue/list
 * @access ADVOCATE
 */
exports.getOverdueFollowUps = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;

    const now = new Date();

    const overdueFollowUps = await FollowUpDiary.find({
      tenantId,
      userId,
      deadline: { $lt: now },
      status: 'pending',
      isActive: true,
    })
      .sort({ deadline: 1 })
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      count: overdueFollowUps.length,
      data: overdueFollowUps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue follow-ups',
      error: error.message,
    });
  }
};

/**
 * DELETE Follow-Up (Soft Delete)
 * @route DELETE /api/diary/follow-up/:id
 * @access ADVOCATE
 */
exports.deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const followUp = await FollowUpDiary.findById(id);

    if (!followUp || followUp.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    followUp.isActive = false;
    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting follow-up',
      error: error.message,
    });
  }
};

module.exports = exports;
