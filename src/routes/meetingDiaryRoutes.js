const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const meetingController = require('../controllers/personalClientMeetingDiaryController');

/**
 * PERSONAL & CLIENT MEETING DIARY ROUTES
 */

// Create meeting
router.post('/', authMiddleware, tenantMiddleware, meetingController.createMeeting);

// Get all today's meetings
router.get('/today/list', authMiddleware, tenantMiddleware, meetingController.getTodayMeetings);

// Get meeting by ID
router.get('/:id', authMiddleware, tenantMiddleware, meetingController.getMeeting);

// Get meetings by client
router.get('/client/:clientId', authMiddleware, tenantMiddleware, meetingController.getMeetingsByClient);

// Update meeting
router.put('/:id', authMiddleware, tenantMiddleware, meetingController.updateMeeting);

// Add voice note
router.post('/:id/voice-note', authMiddleware, tenantMiddleware, meetingController.addVoiceNote);

// Send follow-up reminder
router.post('/:id/send-reminder', authMiddleware, tenantMiddleware, meetingController.sendFollowUpReminder);

// Delete meeting
router.delete('/:id', authMiddleware, tenantMiddleware, meetingController.deleteMeeting);

module.exports = router;
