/**
 * Auth Middlewares Index
 * Auto-generated refactor
 */

const authMiddleware = require('./authMiddleware');
const requireRole = require('./roleMiddleware');
const requirePermission = require('./permissionMiddleware');
const optionalAuth = require('./optionalAuth');

module.exports = {
    authMiddleware,
    requireRole,
    requirePermission,
    optionalAuth
};
