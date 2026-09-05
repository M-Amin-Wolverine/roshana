// ============================================
// 🎭 Middleware نقش‌ها (Role-Based Access Control)
// ============================================

/**
 * Middleware بررسی نقش کاربر
 * @param {...string} roles - نقش‌های مجاز
 * @returns {Function} Middleware function
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'احراز هویت نشده',
        error: 'unauthenticated',
        requestId: req.requestId
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn({
        message: 'دسترسی غیرمجاز به نقش',
        requestId: req.requestId,
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی لازم را ندارید',
        error: 'forbidden',
        requestId: req.requestId
      });
    }
    
    next();
  };
};