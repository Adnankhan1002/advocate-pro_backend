const cron = require('node-cron');
const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const User = require('../models/User');
const Client = require('../models/Client');
const {
  sendHearingReminderEmail,
  sendHearingReminderSMS,
} = require('./reminderService');

/**
 * Send Hearing Reminders Job
 * Runs daily at 8 AM to send reminders for hearings tomorrow
 */
const hearingReminderJob = () => {
  // Schedule: 0 8 * * * (8 AM every day)
  const job = cron.schedule('0 8 * * *', async () => {
    try {
      console.log('\n📅 Starting hearing reminder job...');

      // Calculate tomorrow's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      // Find hearings scheduled for tomorrow
      const hearings = await Hearing.find({
        hearingDate: { $gte: tomorrow, $lt: nextDay },
        status: { $ne: 'cancelled' },
        reminderSent: false,
      })
        .populate('caseId')
        .populate('createdBy', 'firstName lastName email phone');

      console.log(`Found ${hearings.length} hearings for tomorrow`);

      for (const hearing of hearings) {
        try {
          // Get case and client details
          const caseData = await Case.findById(hearing.caseId);
          const client = await Client.findById(caseData.clientId);
          const user = hearing.createdBy;

          if (!caseData || !client || !user) {
            console.log(`Skipping hearing ${hearing._id} - missing data`);
            continue;
          }

          // Send reminder based on preference
          if (hearing.reminderMethod === 'email' || hearing.reminderMethod === 'both') {
            await sendHearingReminderEmail(user, hearing, caseData, client);
          }

          if (hearing.reminderMethod === 'sms' || hearing.reminderMethod === 'both') {
            await sendHearingReminderSMS(user.phone, hearing, caseData);
          }

          // Mark reminder as sent
          hearing.reminderSent = true;
          hearing.reminderSentAt = new Date();
          await hearing.save();

          console.log(`✓ Reminder sent for hearing ${hearing._id}`);
        } catch (error) {
          console.error(`Error sending reminder for hearing ${hearing._id}:`, error.message);
        }
      }

      console.log('📅 Hearing reminder job completed\n');
    } catch (error) {
      console.error('Hearing reminder job error:', error);
    }
  });

  return job;
};

/**
 * Case Status Update Job (Optional)
 * Runs daily to auto-close old cases or update status
 */
const caseStatusUpdateJob = () => {
  const job = cron.schedule('0 22 * * *', async () => {
    try {
      console.log('\n📋 Starting case status update job...');

      // Find cases with past hearings that should be closed
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const oldCases = await Case.find({
        status: 'in_progress',
        nextHearingDate: { $lt: sixMonthsAgo },
        updatedAt: { $lt: sixMonthsAgo },
      });

      console.log(`Found ${oldCases.length} cases to potentially update`);

      // Note: Auto-closing is disabled by default. Uncomment if needed:
      // for (const caseData of oldCases) {
      //   caseData.status = 'closed';
      //   await caseData.save();
      // }

      console.log('📋 Case status update job completed\n');
    } catch (error) {
      console.error('Case status update job error:', error);
    }
  });

  return job;
};

/**
 * Hearing Rescheduling Notification Job (Optional)
 * Runs to notify about upcoming rescheduled hearings
 */
const hearingRescheduleJob = () => {
  const job = cron.schedule('0 10 * * *', async () => {
    try {
      console.log('\n📞 Starting hearing reschedule notification job...');

      // Find hearings with status "postponed" and upcoming new dates
      const postponedHearings = await Hearing.find({
        status: 'postponed',
        nextHearingDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      })
        .populate('caseId')
        .populate('createdBy', 'firstName lastName email');

      console.log(`Found ${postponedHearings.length} rescheduled hearings`);

      // Send notifications (implement as needed)

      console.log('📞 Hearing reschedule notification job completed\n');
    } catch (error) {
      console.error('Hearing reschedule job error:', error);
    }
  });

  return job;
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  console.log('\n🤖 Initializing background jobs...');

  try {
    hearingReminderJob();
    console.log('✓ Hearing reminder job scheduled (8 AM daily)');

    caseStatusUpdateJob();
    console.log('✓ Case status update job scheduled (10 PM daily)');

    hearingRescheduleJob();
    console.log('✓ Hearing reschedule job scheduled (10 AM daily)');

    console.log('🤖 All background jobs initialized\n');
  } catch (error) {
    console.error('Error initializing cron jobs:', error);
  }
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log('✓ All cron jobs stopped');
};

module.exports = {
  initializeCronJobs,
  stopCronJobs,
  hearingReminderJob,
  caseStatusUpdateJob,
  hearingRescheduleJob,
};
