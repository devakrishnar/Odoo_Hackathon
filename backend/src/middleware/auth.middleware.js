import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Access denied. No authentication token provided.', [], 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token.', [err.message], 403);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 'Unauthorized access.', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
        [],
        403
      );
    }

    next();
  };
};

/**
 * Ensures that if a user is a customer, they can only access resources matching their customer ID
 */
export const enforceCustomerOwnership = (paramKey = 'customerId') => {
  return (req, res, next) => {
    if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
      return next();
    }

    if (req.user.role === 'CUSTOMER') {
      const requestedCustomerId = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
      if (requestedCustomerId && req.user.customerId !== requestedCustomerId) {
        return errorResponse(res, 'Forbidden: You can only access your own customer records.', [], 403);
      }
    }

    next();
  };
};
