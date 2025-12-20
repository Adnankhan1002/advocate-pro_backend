const Joi = require('joi');
const Client = require('../models/Client');

// Validation schemas
const createClientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().required(),
  alternatePhone: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  dateOfBirth: Joi.date().optional(),
  aadharNumber: Joi.string().optional(),
  panNumber: Joi.string().optional(),
  category: Joi.string()
    .valid('individual', 'corporate', 'organization')
    .default('individual'),
  notes: Joi.string().optional(),
  totalAmount: Joi.number().min(0).default(0),
  amountPaid: Joi.number().min(0).default(0),
  amountRemaining: Joi.number().min(0).default(0),
});

// Get all clients for tenant
const getAllClients = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { tenantId: req.tenantId, isActive: true };

    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    return res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.clientId,
      tenantId: req.tenantId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Get client error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create new client
const createClient = async (req, res) => {
  try {
    const { error, value } = createClientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    // Check if email already exists in tenant (if provided)
    if (value.email) {
      const existingClient = await Client.findOne({
        tenantId: req.tenantId,
        email: value.email,
      });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists for this tenant',
        });
      }
    }

    const client = new Client({
      tenantId: req.tenantId,
      ...value,
      createdBy: req.user.userId,
    });

    await client.save();

    return res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const { error, value } = createClientSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Strip unknown fields like _id, tenantId, etc.
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.clientId,
        tenantId: req.tenantId,
      },
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete client (soft delete)
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.clientId,
        tenantId: req.tenantId,
      },
      { $set: { isActive: false, status: 'archived' } },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get client statistics
const getClientStats = async (req, res) => {
  try {
    const [total, active, byCategory] = await Promise.all([
      Client.countDocuments({
        tenantId: req.tenantId,
        isActive: true,
      }),
      Client.countDocuments({
        tenantId: req.tenantId,
        isActive: true,
        status: 'active',
      }),
      Client.aggregate([
        { $match: { tenantId: req.tenantId, isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalClients: total,
        activeClients: active,
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
      },
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
};
