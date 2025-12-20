const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const followUpController = require('../controllers/followUpDiaryController');

/**
 * FOLLOW-UP DIARY ROUTES
 */

// Create follow-up
router.post('/', authMiddleware, tenantMiddleware, followUpController.createFollowUp);

// Get all follow-ups
router.get('/', authMiddleware, tenantMiddleware, followUpController.getAllFollowUps);

// Get overdue follow-ups
router.get('/overdue/list', authMiddleware, tenantMiddleware, followUpController.getOverdueFollowUps);

// Get follow-up by ID
router.get('/:id', authMiddleware, tenantMiddleware, followUpController.getFollowUp);

// Update follow-up
router.put('/:id', authMiddleware, tenantMiddleware, followUpController.updateFollowUp);

// Log follow-up attempt
router.post('/:id/attempt', authMiddleware, tenantMiddleware, followUpController.logFollowUpAttempt);

// Send reminder
router.post('/:id/send-reminder', authMiddleware, tenantMiddleware, followUpController.sendFollowUpReminder);

// Delete follow-up
router.delete('/:id', authMiddleware, tenantMiddleware, followUpController.deleteFollowUp);

module.exports = router;
