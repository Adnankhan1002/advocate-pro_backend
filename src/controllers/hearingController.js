const Joi = require('joi');
const Hearing = require('../models/Hearing');
const Case = require('../models/Case');

// Validation schema
const createHearingSchema = Joi.object({
  caseId: Joi.string().required(),
  hearingDate: Joi.date().required(),
  hearingTime: Joi.string().optional(),
  courtroom: Joi.string().optional(),
  judge: Joi.string().optional(),
  description: Joi.string().optional(),
  reminderMethod: Joi.string()
    .valid('email', 'sms', 'both', 'none')
    .default('both'),
  status: Joi.string()
    .valid('scheduled', 'postponed', 'completed', 'cancelled')
    .default('scheduled'),
  notes: Joi.string().optional(),
});

// Get all hearings for tenant (calendar view)
const getHearingsCalendar = async (req, res) => {
  try {
    const { month, year, caseId } = req.query;

    const filter = { tenantId: req.tenantId };

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59);
      filter.hearingDate = { $gte: startDate, $lte: endDate };
    }

    if (caseId) {
      filter.caseId = caseId;
    }

    const hearings = await Hearing.find(filter)
      .populate('caseId', 'title caseNumber')
      .select('-__v')
      .lean();

    // Group by date for calendar view
    const calendar = hearings.reduce((acc, hearing) => {
      const dateKey = hearing.hearingDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(hearing);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: calendar,
      total: hearings.length,
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get upcoming hearings
const getUpcomingHearings = async (req, res) => {
  try {
    const { days = 7, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const filter = {
      tenantId: req.tenantId,
      hearingDate: { $gte: today, $lte: futureDate },
      status: { $ne: 'cancelled' },
    };

    const total = await Hearing.countDocuments(filter);
    const hearings = await Hearing.find(filter)
      .populate('caseId', 'title caseNumber clientId')
      .populate('caseId.clientId', 'firstName lastName phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ hearingDate: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: hearings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get upcoming hearings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get hearing by ID
const getHearingById = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      _id: req.params.hearingId,
      tenantId: req.tenantId,
    })
      .populate('caseId')
      .populate('createdBy', 'firstName lastName email');

    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: hearing,
    });
  } catch (error) {
    console.error('Get hearing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create hearing
const createHearing = async (req, res) => {
  try {
    const { error, value } = createHearingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    // Verify case belongs to tenant
    const caseData = await Case.findOne({
      _id: value.caseId,
      tenantId: req.tenantId,
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    const hearing = new Hearing({
      tenantId: req.tenantId,
      ...value,
      createdBy: req.user.userId,
    });

    await hearing.save();

    // Update case with next hearing date
    await Case.findByIdAndUpdate(caseData._id, {
      $set: { nextHearingDate: value.hearingDate },
    });

    return res.status(201).json({
      success: true,
      message: 'Hearing created successfully',
      data: hearing,
    });
  } catch (error) {
    console.error('Create hearing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update hearing
const updateHearing = async (req, res) => {
  try {
    const { error, value } = createHearingSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const hearing = await Hearing.findOneAndUpdate(
      {
        _id: req.params.hearingId,
        tenantId: req.tenantId,
      },
      { $set: value },
      { new: true, runValidators: true }
    ).populate('caseId');

    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hearing updated successfully',
      data: hearing,
    });
  } catch (error) {
    console.error('Update hearing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete hearing
const deleteHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findOneAndDelete({
      _id: req.params.hearingId,
      tenantId: req.tenantId,
    });

    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hearing deleted successfully',
    });
  } catch (error) {
    console.error('Delete hearing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get hearings by case
const getHearingsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify case belongs to tenant
    const caseData = await Case.findOne({
      _id: caseId,
      tenantId: req.tenantId,
    });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    const total = await Hearing.countDocuments({
      caseId,
      tenantId: req.tenantId,
    });

    const hearings = await Hearing.find({
      caseId,
      tenantId: req.tenantId,
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ hearingDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: hearings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get case hearings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getHearingsCalendar,
  getUpcomingHearings,
  getHearingById,
  createHearing,
  updateHearing,
  deleteHearing,
  getHearingsByCase,
};
