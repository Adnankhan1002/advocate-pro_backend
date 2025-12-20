const Joi = require('joi');
const Case = require('../models/Case');
const Client = require('../models/Client');

// Validation schemas
const createCaseSchema = Joi.object({
  clientId: Joi.string().required(),
  caseNumber: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  caseType: Joi.string()
    .valid(
      'civil',
      'criminal',
      'family',
      'corporate',
      'property',
      'labor',
      'tax',
      'intellectual_property',
      'other'
    )
    .required(),
  status: Joi.string()
    .valid('open', 'in_progress', 'closed', 'on_hold', 'archived')
    .default('open'),
  court: Joi.object({
    name: Joi.string().optional(),
    location: Joi.string().optional(),
    jurisdiction: Joi.string().optional(),
  }).optional(),
  judge: Joi.string().optional(),
  oppositeParty: Joi.string().optional(),
  oppositeAdvocate: Joi.string().optional(),
  filingDate: Joi.date().optional(),
  nextHearingDate: Joi.date().optional(),
  budget: Joi.number().min(0).optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium'),
  assignedTo: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional(),
});

// Get all cases for tenant
const getAllCases = async (req, res) => {
  try {
    const { status, caseType, clientId, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { tenantId: req.tenantId, isActive: true };

    if (status) filter.status = status;
    if (caseType) filter.caseType = caseType;
    if (clientId) filter.clientId = clientId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { oppositeParty: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Case.countDocuments(filter);
    const cases = await Case.find(filter)
      .populate('clientId', 'firstName lastName phone email address')
      .populate('assignedTo', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: cases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get case by ID
const getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findOne({
      _id: req.params.caseId,
      tenantId: req.tenantId,
    })
      .populate('clientId')
      .populate('assignedTo', 'firstName lastName email');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    console.error('Get case error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create new case
const createCase = async (req, res) => {
  try {
    const { error, value } = createCaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    // Verify client belongs to tenant
    const client = await Client.findOne({
      _id: value.clientId,
      tenantId: req.tenantId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check unique case number per tenant
    const existingCase = await Case.findOne({
      tenantId: req.tenantId,
      caseNumber: value.caseNumber,
    });

    if (existingCase) {
      return res.status(409).json({
        success: false,
        message: 'Case number already exists for this tenant',
      });
    }

    const newCase = new Case({
      tenantId: req.tenantId,
      ...value,
      createdBy: req.user.userId,
    });

    await newCase.save();

    return res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: newCase,
    });
  } catch (error) {
    console.error('Create case error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update case
const updateCase = async (req, res) => {
  try {
    const { error, value } = createCaseSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const caseData = await Case.findOneAndUpdate(
      {
        _id: req.params.caseId,
        tenantId: req.tenantId,
      },
      { $set: value },
      { new: true, runValidators: true }
    ).populate('clientId assignedTo');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: caseData,
    });
  } catch (error) {
    console.error('Update case error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete case (soft delete)
const deleteCase = async (req, res) => {
  try {
    const caseData = await Case.findOneAndUpdate(
      {
        _id: req.params.caseId,
        tenantId: req.tenantId,
      },
      { $set: { isActive: false, status: 'archived' } },
      { new: true }
    );

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Case deleted successfully',
    });
  } catch (error) {
    console.error('Delete case error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get case statistics
const getCaseStats = async (req, res) => {
  try {
    const [total, byStatus, byType, upcoming] = await Promise.all([
      Case.countDocuments({
        tenantId: req.tenantId,
        isActive: true,
      }),
      Case.aggregate([
        { $match: { tenantId: req.tenantId, isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Case.aggregate([
        { $match: { tenantId: req.tenantId, isActive: true } },
        { $group: { _id: '$caseType', count: { $sum: 1 } } },
      ]),
      Case.countDocuments({
        tenantId: req.tenantId,
        isActive: true,
        nextHearingDate: { $gte: new Date() },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalCases: total,
        byStatus: byStatus.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
        byType: byType.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
        upcomingHearings: upcoming,
      },
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getCaseStats,
};
