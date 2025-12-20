const ConfidentialLawyerDiary = require('../models/ConfidentialLawyerDiary');
const User = require('../models/User');

/**
 * CONFIDENTIAL LAWYER DIARY CONTROLLER
 * 
 * This diary is for HIGHLY sensitive and confidential notes.
 * Only accessible to the owner (enforce at all levels).
 */

/**
 * CREATE Confidential Entry
 * @route POST /api/diary/confidential
 * @access ADVOCATE (OWNER ONLY)
 */
exports.createConfidentialEntry = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      entryTitle,
      entryType,
      sensitivityLevel,
      caseId,
      clientId,
      caseStrategy,
      clientConfidentialNotes,
      legalStrategy,
      internalNotes,
      riskAnalysis,
      financialNotes,
      entryContent,
      tags,
      biometricLockRequired,
      passwordProtected,
    } = req.body;

    if (!entryTitle || !entryType || !sensitivityLevel || !entryContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const confidentialEntry = new ConfidentialLawyerDiary({
      tenantId,
      userId,
      entryTitle,
      entryType,
      sensitivityLevel: sensitivityLevel || 'confidential',
      caseId,
      clientId,
      caseStrategy,
      clientConfidentialNotes,
      legalStrategy,
      internalNotes,
      riskAnalysis,
      financialNotes,
      entryContent,
      tags: tags || [],
      biometricLockRequired: biometricLockRequired || false,
      passwordProtected: passwordProtected || false,
      status: 'draft',
      createdBy: userId,
    });

    await confidentialEntry.save();

    res.status(201).json({
      success: true,
      message: 'Confidential entry created successfully',
      data: confidentialEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating confidential entry',
      error: error.message,
    });
  }
};

/**
 * GET Confidential Entry by ID
 * @route GET /api/diary/confidential/:id
 * @access OWNER ONLY
 */
exports.getConfidentialEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    const entry = await ConfidentialLawyerDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    // CRITICAL: Ensure only owner can access
    if (entry.userId.toString() !== userId) {
      // Log unauthorized access attempt
      entry.accessLog.push({
        accessedBy: userId,
        accessedAt: new Date(),
        action: 'unauthorized_attempt',
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
      });
      await entry.save();

      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Log authorized access
    entry.accessLog.push({
      accessedBy: userId,
      accessedAt: new Date(),
      action: 'view',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });

    await entry.save();

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching confidential entry',
      error: error.message,
    });
  }
};

/**
 * GET ALL CONFIDENTIAL ENTRIES FOR USER
 * @route GET /api/diary/confidential
 * @access OWNER ONLY
 */
exports.getAllConfidentialEntries = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { sensitivityLevel, entryType } = req.query;

    const query = {
      tenantId,
      userId,
      isActive: true,
    };

    if (sensitivityLevel) query.sensitivityLevel = sensitivityLevel;
    if (entryType) query.entryType = entryType;

    const entries = await ConfidentialLawyerDiary.find(query)
      .sort({ createdAt: -1 })
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching entries',
      error: error.message,
    });
  }
};

/**
 * UPDATE Confidential Entry
 * @route PUT /api/diary/confidential/:id
 * @access OWNER ONLY
 */
exports.updateConfidentialEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const updates = req.body;

    const entry = await ConfidentialLawyerDiary.findById(id);

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only owner can update
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only owner can update this entry',
      });
    }

    // Save version history
    if (updates.entryContent && updates.entryContent !== entry.entryContent) {
      entry.versions.push({
        versionNumber: entry.versions.length + 1,
        content: entry.entryContent,
        editedAt: new Date(),
        editedBy: userId,
        changeDescription: updates.changeDescription || 'Content updated',
      });
    }

    const allowedUpdates = [
      'entryTitle',
      'entryContent',
      'entryType',
      'sensitivityLevel',
      'caseStrategy',
      'clientConfidentialNotes',
      'legalStrategy',
      'internalNotes',
      'riskAnalysis',
      'financialNotes',
      'tags',
      'status',
      'biometricLockRequired',
      'sharedWith',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        entry[field] = updates[field];
      }
    });

    // Log edit
    entry.accessLog.push({
      accessedBy: userId,
      accessedAt: new Date(),
      action: 'edit',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });

    await entry.save();

    res.json({
      success: true,
      message: 'Confidential entry updated successfully',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating entry',
      error: error.message,
    });
  }
};

/**
 * SHARE CONFIDENTIAL ENTRY WITH ANOTHER ADVOCATE
 * @route POST /api/diary/confidential/:id/share
 * @access OWNER ONLY
 */
exports.shareConfidentialEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { shareWithUserId, permissions } = req.body;

    const entry = await ConfidentialLawyerDiary.findById(id);

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only owner can share
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only owner can share this entry',
      });
    }

    // Verify user exists and is in same tenant
    const shareWithUser = await User.findById(shareWithUserId);
    if (!shareWithUser || shareWithUser.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Add to shared list
    entry.sharedWith.push({
      userId: shareWithUserId,
      sharedAt: new Date(),
      sharedBy: userId,
      permissions: permissions || 'view_only',
    });

    // Log share action
    entry.accessLog.push({
      accessedBy: userId,
      accessedAt: new Date(),
      action: 'share',
      ipAddress: req.ip,
      deviceInfo: `Shared with ${shareWithUser.firstName} ${shareWithUser.lastName}`,
    });

    await entry.save();

    res.json({
      success: true,
      message: 'Entry shared successfully',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sharing entry',
      error: error.message,
    });
  }
};

/**
 * REVOKE SHARE
 * @route DELETE /api/diary/confidential/:id/share/:shareId
 * @access OWNER ONLY
 */
exports.revokeShare = async (req, res) => {
  try {
    const { id, shareId } = req.params;
    const { tenantId, userId } = req.user;

    const entry = await ConfidentialLawyerDiary.findById(id);

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only owner can revoke
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only owner can revoke sharing',
      });
    }

    const share = entry.sharedWith.id(shareId);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    share.remove();

    // Log revoke action
    entry.accessLog.push({
      accessedBy: userId,
      accessedAt: new Date(),
      action: 'revoke_share',
      ipAddress: req.ip,
      deviceInfo: `Revoked sharing from ${share.userId}`,
    });

    await entry.save();

    res.json({
      success: true,
      message: 'Share revoked successfully',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error revoking share',
      error: error.message,
    });
  }
};

/**
 * DELETE Confidential Entry
 * @route DELETE /api/diary/confidential/:id
 * @access OWNER ONLY
 */
exports.deleteConfidentialEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    const entry = await ConfidentialLawyerDiary.findById(id);

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only owner can delete
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only owner can delete this entry',
      });
    }

    entry.status = 'deleted';
    entry.isActive = false;

    // Log deletion
    entry.accessLog.push({
      accessedBy: userId,
      accessedAt: new Date(),
      action: 'delete',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });

    await entry.save();

    res.json({
      success: true,
      message: 'Confidential entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting entry',
      error: error.message,
    });
  }
};

/**
 * GET ACCESS LOG (AUDIT TRAIL)
 * @route GET /api/diary/confidential/:id/access-log
 * @access OWNER ONLY
 */
exports.getAccessLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    const entry = await ConfidentialLawyerDiary.findById(id)
      .populate('accessLog.accessedBy', 'firstName lastName email');

    if (!entry || entry.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only owner can view access log
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only owner can view access log',
      });
    }

    res.json({
      success: true,
      count: entry.accessLog.length,
      data: entry.accessLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching access log',
      error: error.message,
    });
  }
};

module.exports = exports;
