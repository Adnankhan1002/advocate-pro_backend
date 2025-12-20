const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const documentController = require('../controllers/documentDiaryController');

/**
 * DOCUMENT DIARY ROUTES
 */

// Create document diary
router.post('/', authMiddleware, tenantMiddleware, documentController.createDocumentDiary);

// Get document diary by case
router.get('/case/:caseId', authMiddleware, tenantMiddleware, documentController.getDocumentDiary);

// Add document to checklist
router.post('/case/:caseId/checklist', authMiddleware, tenantMiddleware, documentController.addDocumentToChecklist);

// Update document status
router.put('/case/:caseId/checklist/:checklistId', authMiddleware, tenantMiddleware, documentController.updateDocumentStatus);

// Upload document
router.post('/case/:caseId/checklist/:checklistId/upload', authMiddleware, tenantMiddleware, documentController.uploadDocument);

// Send reminder to client
router.post('/case/:caseId/send-reminder', authMiddleware, tenantMiddleware, documentController.sendDocumentReminder);

// AI Verify document
router.post('/case/:caseId/checklist/:checklistId/ai-verify', authMiddleware, tenantMiddleware, documentController.aiVerifyDocument);

module.exports = router;
