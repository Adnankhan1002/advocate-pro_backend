const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const confidentialController = require('../controllers/confidentialLawyerDiaryController');

/**
 * CONFIDENTIAL LAWYER DIARY ROUTES
 * 
 * WARNING: These routes are for HIGHLY SENSITIVE information
 * Only the owner (creator) can access their entries
 * All access is logged for audit purposes
 */

// Create confidential entry
router.post('/', authMiddleware, tenantMiddleware, confidentialController.createConfidentialEntry);

// Get all confidential entries for user
router.get('/', authMiddleware, tenantMiddleware, confidentialController.getAllConfidentialEntries);

// Get confidential entry by ID (OWNER ONLY)
router.get('/:id', authMiddleware, tenantMiddleware, confidentialController.getConfidentialEntry);

// Update confidential entry (OWNER ONLY)
router.put('/:id', authMiddleware, tenantMiddleware, confidentialController.updateConfidentialEntry);

// Share confidential entry with another advocate (OWNER ONLY)
router.post('/:id/share', authMiddleware, tenantMiddleware, confidentialController.shareConfidentialEntry);

// Revoke share (OWNER ONLY)
router.delete('/:id/share/:shareId', authMiddleware, tenantMiddleware, confidentialController.revokeShare);

// Get access log (OWNER ONLY)
router.get('/:id/access-log', authMiddleware, tenantMiddleware, confidentialController.getAccessLog);

// Delete confidential entry (OWNER ONLY)
router.delete('/:id', authMiddleware, tenantMiddleware, confidentialController.deleteConfidentialEntry);

module.exports = router;
