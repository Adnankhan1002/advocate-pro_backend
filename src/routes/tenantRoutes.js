const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware, authorizeRole } = require('../middleware/auth');
const Tenant = require('../models/Tenant');

/**
 * @swagger
 * /api/tenant/info:
 *   get:
 *     summary: Get current tenant information
 *     description: Retrieve details about the current tenant
 *     tags:
 *       - Tenant Management
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tenant not found
 *   put:
 *     summary: Update tenant information
 *     description: Update tenant settings and details. Requires OWNER or ADMIN role.
 *     tags:
 *       - Tenant Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTenantRequest'
 *           example:
 *             name: "Smith & Associates - Updated"
 *             timezone: "America/New_York"
 *             language: "en"
 *             website: "https://smithlawfirm.com"
 *             logo: "https://example.com/logo.png"
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Tenant not found
 *
 * @swagger
 * /api/tenant/subscription:
 *   get:
 *     summary: Get subscription information
 *     description: Retrieve current subscription details and plan. Requires OWNER or ADMIN role.
 *     tags:
 *       - Tenant Management
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       type: string
 *                       enum: [free, starter, professional, enterprise]
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, suspended]
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Tenant not found
 */

// Get current tenant info
router.get(
  '/info',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenant = await Tenant.findById(req.tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error('Get tenant info error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Update tenant info
router.put(
  '/info',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  async (req, res) => {
    try {
      const { name, timezone, language, website, logo } = req.body;

      const tenant = await Tenant.findByIdAndUpdate(
        req.tenantId,
        {
          $set: {
            ...(name && { name }),
            ...(website && { website }),
            ...(logo && { logo }),
            ...(timezone && { 'settings.timezone': timezone }),
            ...(language && { 'settings.language': language }),
          },
        },
        { new: true }
      );

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: tenant,
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Get subscription info
router.get(
  '/subscription',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  async (req, res) => {
    try {
      const tenant = await Tenant.findById(req.tenantId).select('subscription');

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: tenant.subscription,
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

module.exports = router;
