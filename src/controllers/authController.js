const Joi = require('joi');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { generateToken } = require('../utils/jwt');

/**
 * Validation Schema for Sign-up
 */
const signupSchema = Joi.object({
  tenantName: Joi.string().min(2).max(100).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Validation Schema for Login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Sign-up Controller
 * Creates a new tenant with the first user (OWNER)
 */
const signup = async (req, res) => {
  try {
    // Validate input
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const { tenantName, firstName, lastName, email, password } = value;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Check if tenant email already exists
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Tenant email already in use',
      });
    }

    // Generate tenant slug from name
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await Tenant.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create new tenant
    const tenant = new Tenant({
      name: tenantName,
      slug: uniqueSlug,
      email,
      subscription: {
        plan: 'free',
        status: 'active',
      },
      settings: {
        timezone: 'UTC',
        language: 'en',
        features: ['case_management', 'basic_reporting'], // Free tier features
      },
      isActive: true,
    });

    await tenant.save();

    // Create first user (OWNER role)
    const user = new User({
      tenantId: tenant._id,
      firstName,
      lastName,
      email,
      password, // Will be hashed by pre-save middleware
      role: 'OWNER',
      isActive: true,
      emailVerified: false,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, tenant._id, user.role);

    // Return response
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
        },
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Login Controller
 * Authenticates user and returns JWT token with userId, tenantId, role
 */
const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const { email, password } = value;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('tenantId', 'name slug');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.tenantId._id, user.role);

    // Remove password from response
    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          slug: user.tenantId.slug,
        },
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get Current User Controller
 * Returns authenticated user details
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('tenantId', 'name slug');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          slug: user.tenantId.slug,
        },
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
};
