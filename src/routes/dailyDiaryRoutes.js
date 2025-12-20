const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const dailyDiaryController = require('../controllers/dailyDiaryController');

/**
 * DAILY DIARY ROUTES
 */

// Get daily diary for a specific date
router.get('/:date', authMiddleware, tenantMiddleware, dailyDiaryController.getDailyDiary);

// Get daily diaries for date range
router.get('/range/list', authMiddleware, tenantMiddleware, dailyDiaryController.getDailyDiaryRange);

// Create or update daily diary
router.post('/', authMiddleware, tenantMiddleware, dailyDiaryController.createOrUpdateDailyDiary);

// Acknowledge alert
router.put('/:diaryId/alert/:alertId/acknowledge', authMiddleware, tenantMiddleware, dailyDiaryController.acknowledgeAlert);

// Sync with calendar
router.post('/:diaryId/sync-calendar', authMiddleware, tenantMiddleware, dailyDiaryController.syncWithCalendar);

module.exports = router;
