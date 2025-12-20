const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const caseNotesController = require('../controllers/caseNotesDiaryController');

/**
 * CASE NOTES DIARY ROUTES
 */

// Create case note
router.post('/', authMiddleware, tenantMiddleware, caseNotesController.createCaseNote);

// Search case notes
router.get('/search', authMiddleware, tenantMiddleware, caseNotesController.searchCaseNotes);

// Get case note by ID
router.get('/:id', authMiddleware, tenantMiddleware, caseNotesController.getCaseNote);

// Get notes by case
router.get('/case/:caseId', authMiddleware, tenantMiddleware, caseNotesController.getCaseNotesByCase);

// Update case note
router.put('/:id', authMiddleware, tenantMiddleware, caseNotesController.updateCaseNote);

// Add attachment
router.post('/:id/attachment', authMiddleware, tenantMiddleware, caseNotesController.addAttachment);

// Add handwritten note
router.post('/:id/handwritten', authMiddleware, tenantMiddleware, caseNotesController.addHandwrittenNote);

// Delete case note
router.delete('/:id', authMiddleware, tenantMiddleware, caseNotesController.deleteCaseNote);

module.exports = router;
