const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const diaryEntryController = require('../controllers/diaryEntryController');

/**
 * DIARY ENTRY ROUTES
 * Simple diary entries for daily activities and notes
 */

// Create diary entry
router.post('/', authMiddleware, tenantMiddleware, diaryEntryController.createDiaryEntry);

// Get diary entries by date
router.get('/:date', authMiddleware, tenantMiddleware, diaryEntryController.getDiaryEntriesByDate);

// Get diary entry by ID
router.get('/detail/:id', authMiddleware, tenantMiddleware, diaryEntryController.getDiaryEntryById);

// Get diary entries by date range
router.get('/range/:startDate/:endDate', authMiddleware, tenantMiddleware, diaryEntryController.getDiaryEntriesByDateRange);

// Update diary entry
router.put('/:id', authMiddleware, tenantMiddleware, diaryEntryController.updateDiaryEntry);

// Delete diary entry
router.delete('/:id', authMiddleware, tenantMiddleware, diaryEntryController.deleteDiaryEntry);

module.exports = router;
