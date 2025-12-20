const express = require('express');
const router = express.Router();
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
} = require('../controllers/clientController');
const { authMiddleware, tenantMiddleware, authorizeRole } = require('../middleware/auth');

/**
 * Client Routes - Protected endpoints
 */

// Get all clients
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  getAllClients
);

// Get client statistics
router.get(
  '/stats/overview',
  authMiddleware,
  tenantMiddleware,
  getClientStats
);

// Create client
router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  createClient
);

// Get client by ID
router.get(
  '/:clientId',
  authMiddleware,
  tenantMiddleware,
  getClientById
);

// Update client
router.put(
  '/:clientId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN', 'ADVOCATE'),
  updateClient
);

// Delete client
router.delete(
  '/:clientId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  deleteClient
);

module.exports = router;
