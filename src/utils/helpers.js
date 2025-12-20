/**
 * Utility functions for common operations
 */

const User = require('../models/User');
const Tenant = require('../models/Tenant');

/**
 * Get user with tenant details
 */
const getUserWithTenant = async (userId) => {
  return User.findById(userId).populate('tenantId');
};

/**
 * Get all users in a tenant
 */
const getTenantUsers = async (tenantId, filters = {}) => {
  return User.find({ tenantId, ...filters })
    .select('-password')
    .lean();
};

/**
 * Check if user has specific permission
 */
const hasPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

/**
 * Get user count in tenant
 */
const getUserCountInTenant = async (tenantId) => {
  return User.countDocuments({ tenantId, isActive: true });
};

/**
 * Get active users in tenant
 */
const getActiveUsersInTenant = async (tenantId) => {
  return User.find({ tenantId, isActive: true })
    .select('-password')
    .lean();
};

/**
 * Deactivate all users in tenant (for suspension)
 */
const deactivateTenantUsers = async (tenantId) => {
  return User.updateMany({ tenantId }, { isActive: false });
};

/**
 * Generate unique tenant slug
 */
const generateUniqueTenantSlug = async (baseName) => {
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let uniqueSlug = slug;
  let counter = 1;

  while (await Tenant.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

/**
 * Get tenant statistics
 */
const getTenantStats = async (tenantId) => {
  const [totalUsers, activeUsers, adminCount] = await Promise.all([
    User.countDocuments({ tenantId }),
    User.countDocuments({ tenantId, isActive: true }),
    User.countDocuments({ tenantId, role: { $in: ['OWNER', 'ADMIN'] } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    adminCount,
  };
};

/**
 * Validate email uniqueness in tenant
 */
const isEmailUniqueInTenant = async (tenantId, email, excludeUserId = null) => {
  const query = { tenantId, email };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await User.findOne(query);
  return !user;
};

/**
 * Get users by role in tenant
 */
const getUsersByRole = async (tenantId, role) => {
  return User.find({ tenantId, role, isActive: true })
    .select('-password')
    .lean();
};

/**
 * Get recently active users
 */
const getRecentlyActiveUsers = async (tenantId, days = 30) => {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  return User.find({
    tenantId,
    lastLogin: { $gte: dateFrom },
  })
    .select('-password')
    .sort({ lastLogin: -1 })
    .lean();
};

/**
 * Send email (placeholder - integrate with SendGrid, Nodemailer, etc.)
 */
const sendEmail = async (to, subject, htmlContent) => {
  // TODO: Implement email service
  console.log(`Sending email to ${to}: ${subject}`);
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({ to, subject, html: htmlContent });
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user, tempPassword) => {
  const htmlContent = `
    <h2>Welcome to Advocate Pro!</h2>
    <p>Hello ${user.firstName},</p>
    <p>Your account has been created. Here are your login details:</p>
    <p>
      <strong>Email:</strong> ${user.email}<br>
      <strong>Temporary Password:</strong> ${tempPassword}
    </p>
    <p>Please log in and change your password immediately.</p>
  `;

  await sendEmail(user.email, 'Welcome to Advocate Pro', htmlContent);
};

/**
 * Check subscription limits
 */
const checkSubscriptionLimit = async (tenantId, feature) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return false;

  const limits = {
    free: { maxUsers: 3, features: ['case_management', 'basic_reporting'] },
    starter: { maxUsers: 10, features: ['case_management', 'reporting', 'billing'] },
    professional: { maxUsers: 50, features: ['case_management', 'reporting', 'billing', 'api'] },
    enterprise: { maxUsers: Infinity, features: ['*'] },
  };

  const planLimits = limits[tenant.subscription.plan];
  return planLimits && planLimits.features.includes(feature);
};

/**
 * Export user data (GDPR compliance)
 */
const exportUserData = async (userId, tenantId) => {
  const user = await User.findOne({ _id: userId, tenantId }).select('-password');
  const tenant = await Tenant.findById(tenantId);

  return {
    user,
    tenant: {
      id: tenant._id,
      name: tenant.name,
      createdAt: tenant.createdAt,
    },
    exportDate: new Date().toISOString(),
  };
};

module.exports = {
  getUserWithTenant,
  getTenantUsers,
  hasPermission,
  getUserCountInTenant,
  getActiveUsersInTenant,
  deactivateTenantUsers,
  generateUniqueTenantSlug,
  getTenantStats,
  isEmailUniqueInTenant,
  getUsersByRole,
  getRecentlyActiveUsers,
  sendEmail,
  sendWelcomeEmail,
  checkSubscriptionLimit,
  exportUserData,
};
