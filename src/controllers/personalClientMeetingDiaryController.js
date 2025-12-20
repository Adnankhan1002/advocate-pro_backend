const PersonalClientMeetingDiary = require('../models/PersonalClientMeetingDiary');
const Client = require('../models/Client');
const { sendEmail, sendSMS } = require('../utils/helpers');

/**
 * PERSONAL & CLIENT MEETING DIARY CONTROLLER
 */

/**
 * CREATE Meeting Entry
 * @route POST /api/diary/meeting
 * @access ADVOCATE
 */
exports.createMeeting = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      clientId,
      clientName,
      purpose,
      description,
      meetingDate,
      startTime,
      endTime,
      mode,
      modeDetails,
      caseId,
      caseNumber,
      notes,
      followUpReminder,
    } = req.body;

    const duration = calculateDuration(startTime, endTime);

    const meeting = new PersonalClientMeetingDiary({
      tenantId,
      userId,
      clientId,
      clientName,
      purpose,
      description,
      meetingDate,
      startTime,
      endTime,
      duration,
      mode,
      modeDetails,
      caseId,
      caseNumber,
      notes,
      followUpReminder: followUpReminder || {
        enabled: true,
        reminderDate: new Date(new Date(meetingDate).getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after meeting
        reminderType: 'in_app',
      },
      createdBy: userId,
    });

    await meeting.save();

    res.status(201).json({
      success: true,
      message: 'Meeting entry created successfully',
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating meeting entry',
      error: error.message,
    });
  }
};

/**
 * GET Meeting by ID
 * @route GET /api/diary/meeting/:id
 * @access ADVOCATE
 */
exports.getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const meeting = await PersonalClientMeetingDiary.findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('caseId', 'title caseNumber')
      .populate('createdBy', 'firstName lastName email');

    if (!meeting || meeting.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting',
      error: error.message,
    });
  }
};

/**
 * GET All Meetings for a Client
 * @route GET /api/diary/meeting/client/:clientId
 * @access ADVOCATE
 */
exports.getMeetingsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tenantId } = req.user;

    const meetings = await PersonalClientMeetingDiary.find({
      tenantId,
      clientId,
      isActive: true,
    })
      .sort({ meetingDate: -1 })
      .populate('caseId', 'title caseNumber');

    res.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message,
    });
  }
};

/**
 * UPDATE Meeting
 * @route PUT /api/diary/meeting/:id
 * @access ADVOCATE
 */
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const updates = req.body;

    const meeting = await PersonalClientMeetingDiary.findById(id);

    if (!meeting || meeting.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'purpose',
      'description',
      'meetingDate',
      'startTime',
      'endTime',
      'mode',
      'modeDetails',
      'notes',
      'clientAttendance',
      'attendees',
      'feesDiscussed',
      'paymentMode',
      'amountReceivedInMeeting',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        meeting[field] = updates[field];
      }
    });

    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating meeting',
      error: error.message,
    });
  }
};

/**
 * ADD VOICE NOTE to Meeting
 * @route POST /api/diary/meeting/:id/voice-note
 * @access ADVOCATE
 */
exports.addVoiceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const meeting = await PersonalClientMeetingDiary.findById(id);

    if (!meeting || meeting.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No voice note file provided',
      });
    }

    // TODO: Calculate duration from audio file
    meeting.voiceNotes.push({
      fileName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      duration: 0,
      uploadedAt: new Date(),
    });

    await meeting.save();

    res.json({
      success: true,
      message: 'Voice note added successfully',
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding voice note',
      error: error.message,
    });
  }
};

/**
 * DELETE Meeting (Soft Delete)
 * @route DELETE /api/diary/meeting/:id
 * @access ADVOCATE
 */
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const meeting = await PersonalClientMeetingDiary.findById(id);

    if (!meeting || meeting.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    meeting.isActive = false;
    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting meeting',
      error: error.message,
    });
  }
};

/**
 * GET TODAY'S MEETINGS
 * @route GET /api/diary/meeting/today/list
 * @access ADVOCATE
 */
exports.getTodayMeetings = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meetings = await PersonalClientMeetingDiary.find({
      tenantId,
      userId,
      meetingDate: {
        $gte: today,
        $lt: tomorrow,
      },
      isActive: true,
    })
      .populate('clientId', 'firstName lastName phone email')
      .populate('caseId', 'caseNumber title')
      .sort({ meetingDate: 1 });

    res.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today meetings',
      error: error.message,
    });
  }
};

/**
 * SEND FOLLOW-UP REMINDER
 * @route POST /api/diary/meeting/:id/send-reminder
 * @access ADVOCATE
 */
exports.sendFollowUpReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const meeting = await PersonalClientMeetingDiary.findById(id)
      .populate('clientId', 'email phone');

    if (!meeting || meeting.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const client = meeting.clientId;

    if (!meeting.followUpReminder.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up reminder is not enabled for this meeting',
      });
    }

    // Send reminder
    let sent = false;

    if (meeting.followUpReminder.reminderMode === 'email' && client.email) {
      await sendEmail(
        client.email,
        'Follow-up Reminder',
        meeting.followUpReminder.reminderMessage || `Please remember to follow up regarding our meeting on ${meeting.meetingDate.toDateString()}.`
      );
      sent = true;
    }

    if (meeting.followUpReminder.reminderMode === 'sms' && client.phone) {
      await sendSMS(
        client.phone,
        meeting.followUpReminder.reminderMessage || `Follow-up reminder from your advocate regarding our recent meeting.`
      );
      sent = true;
    }

    if (sent) {
      meeting.followUpReminder.reminderSent = true;
      meeting.followUpReminder.reminderSentAt = new Date();
      await meeting.save();
    }

    res.json({
      success: true,
      message: 'Follow-up reminder sent successfully',
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending follow-up reminder',
      error: error.message,
    });
  }
};

// UTILITY FUNCTIONS
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;

  // Parse times (assuming format "HH:MM")
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return Math.abs(endTotalMinutes - startTotalMinutes);
}

module.exports = exports;
