const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const courtHearingDiaryController = require('../controllers/courtHearingDiaryController');

/**
 * COURT HEARING DIARY ROUTES
 */

// Create court hearing
router.post('/', authMiddleware, tenantMiddleware, courtHearingDiaryController.createCourtHearing);

// Get all today's hearings
router.get('/today/upcoming', authMiddleware, tenantMiddleware, courtHearingDiaryController.getTodayHearings);

// Get court hearing by ID
router.get('/:id', authMiddleware, tenantMiddleware, courtHearingDiaryController.getCourtHearing);

// Get hearings by case
router.get('/case/:caseId', authMiddleware, tenantMiddleware, courtHearingDiaryController.getCourtHearingsByCase);

// Update court hearing
router.put('/:id', authMiddleware, tenantMiddleware, courtHearingDiaryController.updateCourtHearing);

// Add hearing outcome
router.post('/:id/outcome', authMiddleware, tenantMiddleware, courtHearingDiaryController.addHearingOutcome);

// Delete court hearing
router.delete('/:id', authMiddleware, tenantMiddleware, courtHearingDiaryController.deleteCourtHearing);

module.exports = router;
