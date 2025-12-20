const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware, authorizeRole } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @swagger
 * /api/users/users:
 *   get:
 *     summary: Get all users in tenant
 *     description: Retrieve all users belonging to the current tenant. Requires OWNER or ADMIN role.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - insufficient permissions
 *   post:
 *     summary: Create new user in tenant
 *     description: Add a new user to the current tenant. Requires OWNER or ADMIN role.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             firstName: "Jane"
 *             lastName: "Smith"
 *             email: "jane@lawfirm.com"
 *             role: "ADVOCATE"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       409:
 *         description: User already exists in tenant
 *
 * @swagger
 * /api/users/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user's details within the same tenant
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     description: Update user details. Users can update their own profile. OWNER/ADMIN can update any user and change roles.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user (soft delete)
 *     description: Deactivate a user account. Requires OWNER or ADMIN role.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 */

// Get all users in tenant
router.get(
  '/users',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  async (req, res) => {
    try {
      const users = await User.find(req.getTenantFilter())
        .select('-password')
        .lean();

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Get user by ID (within same tenant)
router.get(
  '/users/:userId',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({
        _id: req.params.userId,
        ...req.getTenantFilter(),
      }).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Create new user in tenant
router.post(
  '/users',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  async (req, res) => {
    try {
      const { firstName, lastName, email, role } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      // Check if user already exists in tenant
      const existingUser = await User.findOne({
        email,
        tenantId: req.tenantId,
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists in this tenant',
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      const newUser = new User({
        tenantId: req.tenantId,
        firstName,
        lastName,
        email,
        password: tempPassword,
        role,
        isActive: true,
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
        },
        // In production, send this via email
        tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
      });
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Update user
router.put(
  '/users/:userId',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { firstName, lastName, role } = req.body;

      // Users can only update their own profile or admins can update others
      const isOwnProfile = req.user.userId === req.params.userId;
      const isAdmin = req.user.role === 'OWNER' || req.user.role === 'ADMIN';

      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      const user = await User.findOne({
        _id: req.params.userId,
        ...req.getTenantFilter(),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Only admins can change role
      if (role && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can change user roles',
        });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (role && isAdmin) user.role = role;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Delete user
router.delete(
  '/users/:userId',
  authMiddleware,
  tenantMiddleware,
  authorizeRole('OWNER', 'ADMIN'),
  async (req, res) => {
    try {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.userId,
          ...req.getTenantFilter(),
        },
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

module.exports = router;
