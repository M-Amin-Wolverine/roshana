// ============================================
// 🔑 Middleware مجوزها (Permission-Based Access)
// ============================================

/**
 * Middleware بررسی مجوز کاربر
 * @param {...string} permissions - مجوزهای مورد نیاز
 * @returns {Function} Middleware function
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'احراز هویت نشده',
        error: 'unauthenticated',
        requestId: req.requestId
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(perm => userPermissions.includes(perm));
    
    if (!hasAllPermissions) {
      logger.warn({
        message: 'دسترسی غیرمجاز به مجوز',
        requestId: req.requestId,
        userId: req.user.id,
        requiredPermissions: permissions,
        userPermissions: userPermissions,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: 'شما مجوز لازم را ندارید',
        error: 'permission_denied',
        requiredPermissions: permissions,
        requestId: req.requestId
      });
    }
    
    next();
  };
};
