const express = require('express');
const router = express.Router();
const {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getCaseStats,
} = require('../controllers/caseController');
const { authMiddleware, tenantMiddleware, authorizeRole } = require('../middleware/auth');

/**
 * Case Routes - Protected endpoints
 */

// Get all cases
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  getAllCases
);

// Get case statistics
router.get(
  '/stats/overview',
  authMiddleware,
  tenantMiddleware,
  getCaseStats
);

// Create case
router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  createCase
);

// Get case by ID
router.get(
  '/:caseId',
  authMiddleware,
  tenantMiddleware,
  getCaseById
);

// Update case
router.put(
  '/:caseId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  updateCase
);

// Delete case
router.delete(
  '/:caseId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  deleteCase
);

module.exports = router;
