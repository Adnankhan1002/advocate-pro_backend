const express = require('express');
const router = express.Router();
const {
  getHearingsCalendar,
  getUpcomingHearings,
  getHearingById,
  createHearing,
  updateHearing,
  deleteHearing,
  getHearingsByCase,
} = require('../controllers/hearingController');
const { authMiddleware, tenantMiddleware, authorizeRole } = require('../middleware/auth');

/**
 * Hearing Routes - Protected endpoints
 */

// Get calendar view (month/year based)
router.get(
  '/calendar',
  authMiddleware,
  tenantMiddleware,
  getHearingsCalendar
);

// Get upcoming hearings
router.get(
  '/upcoming/list',
  authMiddleware,
  tenantMiddleware,
  getUpcomingHearings
);

// Create hearing
router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  createHearing
);

// Get hearing by ID
router.get(
  '/:hearingId',
  authMiddleware,
  tenantMiddleware,
  getHearingById
);

// Update hearing
router.put(
  '/:hearingId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  updateHearing
);

// Delete hearing
router.delete(
  '/:hearingId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  deleteHearing
);

// Get hearings by case
router.get(
  '/case/:caseId',
  authMiddleware,
  tenantMiddleware,
  getHearingsByCase
);

module.exports = router;
