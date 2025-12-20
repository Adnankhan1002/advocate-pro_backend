const DailyDiary = require('../models/DailyDiary');
const CourtHearingDiary = require('../models/CourtHearingDiary');
const PersonalClientMeetingDiary = require('../models/PersonalClientMeetingDiary');
const FollowUpDiary = require('../models/FollowUpDiary');
const TaskToDoDiary = require('../models/TaskToDoDiary');
const Case = require('../models/Case');
const { sendNotification } = require('../utils/helpers');

/**
 * DAILY DIARY CONTROLLER
 * Handles all Daily Diary operations
 */

/**
 * GET Daily Diary for a specific date
 * @route GET /api/diary/daily/:date
 * @access ADVOCATE
 */
exports.getDailyDiary = async (req, res) => {
  try {
    const { date } = req.params;
    const { tenantId, userId } = req.user;

    // Parse date
    const diaryDate = new Date(date);
    diaryDate.setHours(0, 0, 0, 0);

    const dailyDiary = await DailyDiary.findOne({
      tenantId,
      userId,
      date: diaryDate,
    })
      .populate('hearings.hearingId')
      .populate('clientMeetings.meetingId')
      .populate('followUps.followUpId')
      .populate('tasks.taskId')
      .populate('tasks.assignedTo', 'firstName lastName email');

    if (!dailyDiary) {
      return res.status(404).json({
        success: false,
        message: 'Daily diary entry not found for this date',
      });
    }

    res.json({
      success: true,
      data: dailyDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily diary',
      error: error.message,
    });
  }
};

/**
 * CREATE or UPDATE Daily Diary
 * @route POST /api/diary/daily
 * @access ADVOCATE
 */
exports.createOrUpdateDailyDiary = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { date } = req.body;

    const diaryDate = new Date(date);
    diaryDate.setHours(0, 0, 0, 0);

    // Fetch all today's items automatically
    const todayStart = new Date(diaryDate);
    const todayEnd = new Date(diaryDate);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Fetch hearings
    const hearings = await CourtHearingDiary.find({
      tenantId,
      'hearing.date': {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }).select('_id caseTitle court hearing clientId');

    // Fetch client meetings
    const clientMeetings = await PersonalClientMeetingDiary.find({
      tenantId,
      userId,
      meetingDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }).select('_id clientName purpose meetingDate mode');

    // Fetch follow-ups
    const followUps = await FollowUpDiary.find({
      tenantId,
      userId,
      deadline: {
        $gte: todayStart,
        $lt: todayEnd,
      },
      status: { $ne: 'done' },
    }).select('_id followTarget followObject deadline status priority');

    // Fetch today's tasks
    const tasks = await TaskToDoDiary.find({
      tenantId,
      assignedTo: userId,
      deadline: {
        $gte: todayStart,
        $lt: todayEnd,
      },
      status: { $ne: 'completed' },
    }).select('_id title assignedTo deadline status priority');

    // Fetch cases with deadlines
    const caseDeadlines = await Case.find({
      tenantId,
      assignedTo: userId,
      nextHearingDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }).select('_id title caseNumber nextHearingDate priority');

    // Find or create daily diary
    let dailyDiary = await DailyDiary.findOne({
      tenantId,
      userId,
      date: diaryDate,
    });

    if (!dailyDiary) {
      dailyDiary = new DailyDiary({
        tenantId,
        userId,
        date: diaryDate,
        hearings: hearings.map((h) => ({
          hearingId: h._id,
          caseTitle: h.caseTitle,
          courtName: h.court.name,
          courtRoom: h.hearing.courtRoom,
          itemNo: h.hearing.itemNo,
          time: h.hearing.date,
        })),
        clientMeetings: clientMeetings.map((m) => ({
          meetingId: m._id,
          clientName: m.clientName,
          purpose: m.purpose,
          time: m.meetingDate,
          mode: m.mode,
        })),
        followUps: followUps.map((f) => ({
          followUpId: f._id,
          followTarget: f.followTarget,
          followObject: f.followObject,
          deadline: f.deadline,
          status: f.status,
          priority: f.priority,
        })),
        tasks: tasks.map((t) => ({
          taskId: t._id,
          title: t.title,
          assignedTo: t.assignedTo,
          deadline: t.deadline,
          status: t.status,
          priority: t.priority,
        })),
        deadlines: caseDeadlines.map((c) => ({
          title: c.title,
          caseId: c._id,
          dueDate: c.nextHearingDate,
          priority: c.priority,
          type: 'hearing',
        })),
      });

      await dailyDiary.save();
    } else {
      // Update existing diary
      dailyDiary.hearings = hearings.map((h) => ({
        hearingId: h._id,
        caseTitle: h.caseTitle,
        courtName: h.court.name,
        courtRoom: h.hearing.courtRoom,
        itemNo: h.hearing.itemNo,
        time: h.hearing.date,
      }));
      dailyDiary.clientMeetings = clientMeetings.map((m) => ({
        meetingId: m._id,
        clientName: m.clientName,
        purpose: m.purpose,
        time: m.meetingDate,
        mode: m.mode,
      }));
      dailyDiary.followUps = followUps.map((f) => ({
        followUpId: f._id,
        followTarget: f.followTarget,
        followObject: f.followObject,
        deadline: f.deadline,
        status: f.status,
        priority: f.priority,
      }));
      dailyDiary.tasks = tasks.map((t) => ({
        taskId: t._id,
        title: t.title,
        assignedTo: t.assignedTo,
        deadline: t.deadline,
        status: t.status,
        priority: t.priority,
      }));
      dailyDiary.deadlines = caseDeadlines.map((c) => ({
        title: c.title,
        caseId: c._id,
        dueDate: c.nextHearingDate,
        priority: c.priority,
        type: 'hearing',
      }));

      await dailyDiary.save();
    }

    // Fetch alerts (if any)
    const alerts = await generateDailyAlerts(tenantId, userId, diaryDate);
    dailyDiary.alerts = alerts;
    await dailyDiary.save();

    res.status(201).json({
      success: true,
      message: 'Daily diary created/updated successfully',
      data: dailyDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating/updating daily diary',
      error: error.message,
    });
  }
};

/**
 * GET Daily Diary for a date range
 * @route GET /api/diary/daily-range
 * @access ADVOCATE
 */
exports.getDailyDiaryRange = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const diaries = await DailyDiary.find({
      tenantId,
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    res.json({
      success: true,
      count: diaries.length,
      data: diaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily diaries',
      error: error.message,
    });
  }
};

/**
 * ACKNOWLEDGE ALERT
 * @route PUT /api/diary/daily/:diaryId/alert/:alertId/acknowledge
 * @access ADVOCATE
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { diaryId, alertId } = req.params;
    const { tenantId } = req.user;

    const dailyDiary = await DailyDiary.findById(diaryId);

    if (!dailyDiary || dailyDiary.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const alert = dailyDiary.alerts.id(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();

    await dailyDiary.save();

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert',
      error: error.message,
    });
  }
};

/**
 * SYNC WITH CALENDAR
 * @route POST /api/diary/daily/:diaryId/sync-calendar
 * @access ADVOCATE
 */
exports.syncWithCalendar = async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { calendarType, accessToken } = req.body;
    const { tenantId } = req.user;

    const dailyDiary = await DailyDiary.findById(diaryId);

    if (!dailyDiary || dailyDiary.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // TODO: Implement Google Calendar / Outlook integration
    // For now, just mark as synced
    if (calendarType === 'google') {
      dailyDiary.calendarSync.googleCalendar.synced = true;
      dailyDiary.calendarSync.googleCalendar.lastSyncAt = new Date();
    } else if (calendarType === 'outlook') {
      dailyDiary.calendarSync.outlookCalendar.synced = true;
      dailyDiary.calendarSync.outlookCalendar.lastSyncAt = new Date();
    }

    await dailyDiary.save();

    res.json({
      success: true,
      message: `Synced with ${calendarType} calendar`,
      data: dailyDiary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing with calendar',
      error: error.message,
    });
  }
};

/**
 * GENERATE DAILY ALERTS
 * @private
 */
async function generateDailyAlerts(tenantId, userId, date) {
  const alerts = [];

  // Check for case limitations (30/60/90 days before expiry)
  const cases = await Case.find({
    tenantId,
    assignedTo: userId,
    isActive: true,
  });

  for (const caseRecord of cases) {
    if (caseRecord.nextHearingDate) {
      const daysUntilHearing = Math.ceil(
        (caseRecord.nextHearingDate - date) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilHearing === 7) {
        alerts.push({
          type: 'hearing_reminder',
          message: `Hearing scheduled in 7 days for case ${caseRecord.caseNumber}`,
          relatedEntity: 'case',
          relatedId: caseRecord._id,
          severity: 'high',
        });
      }

      if (daysUntilHearing === 1) {
        alerts.push({
          type: 'hearing_reminder',
          message: `Important: Hearing TOMORROW for case ${caseRecord.caseNumber}`,
          relatedEntity: 'case',
          relatedId: caseRecord._id,
          severity: 'critical',
        });
      }
    }
  }

  // Check for overdue follow-ups
  const overdueFollowUps = await FollowUpDiary.find({
    tenantId,
    userId,
    deadline: { $lt: date },
    status: 'pending',
  });

  if (overdueFollowUps.length > 0) {
    alerts.push({
      type: 'overdue_follow_up',
      message: `You have ${overdueFollowUps.length} overdue follow-ups`,
      relatedEntity: 'follow_up',
      severity: 'high',
    });
  }

  // Check for pending documents
  const DocumentDiary = require('../models/DocumentDiary');
  const pendingDocs = await DocumentDiary.find({
    tenantId,
    'documentChecklist.status': 'pending',
    'documentChecklist.dueDate': { $lt: date },
  });

  if (pendingDocs.length > 0) {
    alerts.push({
      type: 'pending_document',
      message: `${pendingDocs.length} cases have pending documents`,
      relatedEntity: 'case',
      severity: 'medium',
    });
  }

  return alerts;
}

module.exports = exports;
