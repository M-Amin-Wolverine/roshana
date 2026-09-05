const authMiddleware = async (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  try {
    // 📥 دریافت هدر Authorization
    const authHeader = req.headers.authorization;
    
    // بررسی وجود هدر
    if (!authHeader) {
      logger.warn({
        message: 'توکن احراز هویت یافت نشد',
        requestId,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        success: false,
        message: 'توکن احراز هویت یافت نشد',
        error: 'no_token',
        requestId
      });
    }
    
    // بررسی فرمت Bearer
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn({
        message: 'فرمت توکن نامعتبر',
        requestId,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        success: false,
        message: 'فرمت توکن باید Bearer باشد',
        error: 'invalid_token_format',
        requestId
      });
    }
    
    // استخراج توکن
    const token = authHeader.split(' ')[1];
    
    // بررسی خالی نبودن توکن
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'توکن خالی است',
        error: 'empty_token',
        requestId
      });
    }
    
    // 🔒 بررسی بلاک‌لیست
    if (await isTokenBlacklisted(token)) {
      logger.warn({
        message: 'تلاش استفاده از توکن بلاک شده',
        requestId,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        success: false,
        message: 'توکن باطل شده است',
        error: 'token_revoked',
        requestId
      });
    }
    
    // 🔑 دریافت secret از متغیر محیطی
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    
    if (!accessSecret) {
      logger.error('JWT_ACCESS_SECRET تنظیم نشده است!');
      return res.status(500).json({
        success: false,
        message: 'خطای پیکربندی سرور',
        error: 'server_config_error',
        requestId
      });
    }
    
    // ✅ اعتبارسنجی توکن
    let decoded;
    try {
      decoded = verifyToken(token, accessSecret, 'access');
    } catch (jwtError) {
      // بررسی نوع خطای JWT
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn({
          message: 'توکن منقضی شده',
          requestId,
          ip: req.ip,
          path: req.path,
          expiredAt: jwtError.expiredAt
        });
        
        return res.status(401).json({
          success: false,
          message: 'توکن منقضی شده است',
          error: 'token_expired',
          expiredAt: jwtError.expiredAt,
          requestId
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        logger.warn({
          message: 'توکن نامعتبر',
          requestId,
          ip: req.ip,
          path: req.path,
          error: jwtError.message
        });
        
        return res.status(401).json({
          success: false,
          message: 'توکن نامعتبر',
          error: 'invalid_token',
          requestId
        });
      }
      
      throw jwtError;
    }
    
    // 👤 بررسی وجود کاربر (بدون await چون متد همزمان است)
    let user;
    try {
      user = User.findById(decoded.payload.id); // حذف await
    } catch (userError) {
      logger.error({
        message: 'خطا در جستجوی کاربر',
        requestId,
        error: userError.message,
        userId: decoded.payload.id
      });
      
      return res.status(500).json({
        success: false,
        message: 'خطا در جستجوی کاربر',
        error: 'user_search_error',
        requestId
      });
    }
    
    if (!user) {
      logger.warn({
        message: 'کاربر یافت نشد',
        requestId,
        userId: decoded.payload.id,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'user_not_found',
        requestId
      });
    }
    
    if (!user.isActive) {
      logger.warn({
        message: 'کاربر غیرفعال',
        requestId,
        userId: user.id,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری شما غیرفعال است',
        error: 'user_inactive',
        requestId
      });
    }
    
    // بررسی تغییر رمز عبور بعد از صدور توکن
    if (user.passwordChangedAt && decoded.payload.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
      logger.warn({
        message: 'توکن قبل از تغییر رمز صادر شده',
        requestId,
        userId: user.id,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'لطفاً دوباره وارد شوید',
        error: 'password_changed',
        requestId
      });
    }
    
    // 📝 افزودن اطلاعات کاربر به درخواست
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };
    
    req.tokenPayload = decoded.payload;
    
    // ✅ لاگ موفقیت
    logger.info({
      message: 'احراز هویت موفق',
      requestId,
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      path: req.path
    });
    
    next();
    
  } catch (error) {
    // اصلاح شده - بررسی وجود error
    const errorMessage = error && error.message ? error.message : 'Unknown error occurred';
    const errorStack = error && error.stack ? error.stack : 'No stack trace';
    
    logger.error({
      message: 'خطا در احراز هویت',
      requestId,
      error: errorMessage,
      stack: errorStack,
      ip: req.ip,
      path: req.path
    });
    
    return res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
      error: 'auth_internal_error',
      requestId
    });
  }
};