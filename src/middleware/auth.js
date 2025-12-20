const { verifyToken } = require('../utils/jwt');

/**
 * Authentication Middleware
 * Verifies JWT token and injects user claims into request
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    // Inject user claims into request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * Tenant Isolation Middleware
 * Ensures queries are scoped to the authenticated tenant
 */
const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  // Inject tenantId into request for use in controllers
  req.tenantId = req.user.tenantId;

  // Add query filter helper
  req.getTenantFilter = () => ({
    tenantId: req.tenantId,
  });

  next();
};

/**
 * Role-Based Access Control Middleware
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this action',
        requiredRole: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  tenantMiddleware,
  authorizeRole,
};
