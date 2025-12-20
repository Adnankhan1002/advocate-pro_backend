const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

/**
 * @route   POST /api/documents/generate
 * @desc    Generate legal document using AI
 * @access  Private
 */
router.post('/generate', authMiddleware, tenantMiddleware, documentController.generateDocument);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload document from local system
 * @access  Private
 */
router.post('/upload', authMiddleware, tenantMiddleware, documentController.uploadDocument);

/**
 * @route   GET /api/documents/by-case
 * @desc    Get documents grouped by case
 * @access  Private
 */
router.get('/by-case', authMiddleware, tenantMiddleware, documentController.getDocumentsGroupedByCase);

/**
 * @route   GET /api/documents/case/:caseId
 * @desc    Get documents for a specific case
 * @access  Private
 */
router.get('/case/:caseId', authMiddleware, tenantMiddleware, documentController.getDocumentsByCase);

/**
 * @route   GET /api/documents/:documentId/export
 * @desc    Export document
 * @access  Private
 */
router.get('/:documentId/export', authMiddleware, tenantMiddleware, documentController.exportDocument);

/**
 * @route   GET /api/documents/:documentId
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:documentId', authMiddleware, tenantMiddleware, documentController.getDocumentById);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for tenant
 * @access  Private
 */
router.get('/', authMiddleware, tenantMiddleware, documentController.getAllDocuments);

/**
 * @route   PATCH /api/documents/:documentId
 * @desc    Update document
 * @access  Private
 */
router.patch('/:documentId', authMiddleware, tenantMiddleware, documentController.updateDocument);

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Delete document (soft delete)
 * @access  Private
 */
router.delete('/:documentId', authMiddleware, tenantMiddleware, documentController.deleteDocument);

module.exports = router;
