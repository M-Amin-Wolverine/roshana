// ============================================
// 🎯 میدلور مدیریت پاسخ‌های استاندارد
// ============================================

const { createResponse, getStatusByName, getStatusByCode } = require('../constants/http-status');

/**
 * میدلور اصلی برای مدیریت پاسخ‌های یکپارچه
 * @returns {Function} - میدلور Express
 */
function responseMiddleware() {
  return (req, res, next) => {
    // زمان شروع درخواست برای محاسبه مدت پردازش
    res.startTime = Date.now();
    
    /**
     * ارسال پاسخ استاندارد
     * @param {string} statusName - نام کد وضعیت
     * @param {any} data - داده‌های پاسخ
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.respond = (statusName, data = null, lang = 'FA') => {
      const response = createResponse(statusName, lang, data);
      
      // محاسبه مدت پردازش
      const duration = Date.now() - res.startTime;
      response.duration = `${duration}ms`;
      
      // افزودن metadata
      response.requestId = req.requestId || crypto.randomUUID?.() || Date.now();
      response.endpoint = `${req.method} ${req.originalUrl}`;
      
      // لاگ پاسخ
      logResponse(req, response);
      
      return res.status(response.code).json(response);
    };
    
    /**
     * ارسال پاسخ موفقیت‌آمیز
     * @param {any} data - داده‌های پاسخ
     * @param {string} statusName - نام کد وضعیت (پیش‌فرض: OK)
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.success = (data = null, statusName = 'OK', lang = 'FA') => {
      return res.respond(statusName, data, lang);
    };
    
    /**
     * ارسال پاسخ خطا
     * @param {string} statusName - نام کد وضعیت
     * @param {any} data - داده‌های خطا
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.error = (statusName, data = null, lang = 'FA') => {
      return res.respond(statusName, data, lang);
    };
    
    /**
     * ارسال پاسخ اعتبارسنجی ناموفق
     * @param {Array|object} errors - خطاهای اعتبارسنجی
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.validationError = (errors, lang = 'FA') => {
      return res.respond('VALIDATION_ERROR', { errors }, lang);
    };
    
    /**
     * ارسال پاسخ عدم دسترسی
     * @param {string} permission - مجوز مورد نیاز
     * @param {string} resource - منبع مورد نظر
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.accessDenied = (permission = null, resource = null, lang = 'FA') => {
      const data = {};
      if (permission) data.requiredPermission = permission;
      if (resource) data.resource = resource;
      
      return res.respond('ACCESS_DENIED', data, lang);
    };
    
    /**
     * ارسال پاسخ عدم یافت
     * @param {string} resource - نام منبع
     * @param {string|number} id - شناسه منبع
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.notFound = (resource = null, id = null, lang = 'FA') => {
      const data = {};
      if (resource) data.resource = resource;
      if (id) data.id = id;
      
      return res.respond('NOT_FOUND', data, lang);
    };
    
    /**
     * ارسال پاسخ احراز هویت ناموفق
     * @param {string} reason - دلیل خطا
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.unauthorized = (reason = null, lang = 'FA') => {
      const data = reason ? { reason } : null;
      return res.respond('UNAUTHORIZED', data, lang);
    };
    
    /**
     * ارسال پاسخ محدودیت نرخ
     * @param {number} retryAfter - زمان انتظار برای درخواست مجدد (ثانیه)
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.rateLimitExceeded = (retryAfter = 60, lang = 'FA') => {
      return res.respond('RATE_LIMIT_EXCEEDED', { retryAfter }, lang);
    };
    
    /**
     * ارسال پاسخ ایجاد موفق
     * @param {any} data - داده ایجاد شده
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.created = (data, lang = 'FA') => {
      return res.respond('CREATED', data, lang);
    };
    
    /**
     * ارسال پاسخ بدون محتوا
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.noContent = (lang = 'FA') => {
      return res.respond('NO_CONTENT', null, lang);
    };
    
    /**
     * ارسال پاسخ عملیات موفق
     * @param {any} data - داده‌های عملیات
     * @param {string} message - پیام سفارشی
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.operationSuccess = (data = null, message = null, lang = 'FA') => {
      const responseData = message ? { ...data, customMessage: message } : data;
      return res.respond('OPERATION_SUCCESS', responseData, lang);
    };
    
    /**
     * ارسال پاسخ با کد سفارشی
     * @param {number} code - کد وضعیت
     * @param {any} data - داده‌های پاسخ
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.custom = (code, data = null, lang = 'FA') => {
      const status = getStatusByCode(code);
      if (!status) {
        // اگر کد ناشناخته بود
        return res.status(code).json({
          success: code < 400,
          code,
          message: 'Custom Status Code',
          data,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.respond(status.name, data, lang);
    };
    
    /**
     * ارسال پاسخ صفحه‌بندی شده
     * @param {Array} items - آیتم‌های صفحه
     * @param {number} total - تعداد کل آیتم‌ها
     * @param {number} page - صفحه جاری
     * @param {number} limit - تعداد در هر صفحه
     * @param {string} statusName - نام کد وضعیت
     * @param {string} lang - زبان پاسخ
     * @returns {object} - پاسخ JSON
     */
    res.paginated = (items, total, page, limit, statusName = 'OK', lang = 'FA') => {
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      const pagination = {
        total,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null
      };
      
      const data = {
        items,
        pagination
      };
      
      return res.respond(statusName, data, lang);
    };
    
    // لاگ درخواست
    logRequest(req);
    
    next();
  };
}

/**
 * لاگ درخواست ورودی
 * @param {object} req - درخواست Express
 */
function logRequest(req) {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };
  
  // فقط در حالت development یا staging لاگ کامل نمایش داده شود
  if (process.env.NODE_ENV !== 'production') {
    console.log('📥 [REQUEST]', logData);
  }
}

/**
 * لاگ پاسخ خروجی
 * @param {object} req - درخواست Express
 * @param {object} response - پاسخ تولید شده
 */
function logResponse(req, response) {
  const emoji = getResponseEmoji(response.code);
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: response.code,
    statusName: response.name,
    duration: response.duration,
    success: response.success,
    timestamp: response.timestamp
  };
  
  // لاگ بر اساس نوع پاسخ
  if (response.success) {
    console.log(`${emoji} [SUCCESS]`, logData);
  } else {
    console.error(`${emoji} [ERROR]`, {
      ...logData,
      message: response.message,
      data: response.data
    });
  }
}

/**
 * دریافت ایموجی مناسب برای کد وضعیت
 * @param {number} code - کد وضعیت
 * @returns {string} - ایموجی
 */
function getResponseEmoji(code) {
  if (code < 200) return 'ℹ️';   // اطلاعاتی
  if (code < 300) return '✅';   // موفقیت
  if (code < 400) return '🔄';   // تغییر مسیر
  if (code < 500) return '⚠️';   // خطای کلاینت
  return '❌';                  // خطای سرور
}

/**
 * میدلور برای مدیریت خطاهای 404
 * @returns {Function} - میدلور Express
 */
function notFoundMiddleware() {
  return (req, res) => {
    res.error('NOT_FOUND', {
      path: req.originalUrl,
      method: req.method,
      message: 'مسیر درخواست شده یافت نشد'
    }, 'FA');
  };
}

/**
 * میدلور هندلر خطاهای مرکزی
 * @returns {Function} - میدلور Express
 */
function errorHandlerMiddleware() {
  return (err, req, res, next) => {
    console.error('🚨 [UNHANDLED_ERROR]', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // خطاهای اعتبارسنجی Mongoose/Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message,
        type: error.kind
      }));
      
      return res.validationError(errors);
    }
    
    // خطاهای JWT
    if (err.name === 'JsonWebTokenError') {
      return res.error('TOKEN_INVALID', {
        message: 'توکن احراز هویت نامعتبر است'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.error('TOKEN_EXPIRED', {
        message: 'توکن احراز هویت منقضی شده است'
      });
    }
    
    // خطاهای کلید تکراری (MongoDB)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      
      return res.error('CONFLICT', {
        message: `رکورد با ${field} = ${value} از قبل وجود دارد`,
        field,
        value
      });
    }
    
    // خطاهای CastError (مانند ObjectId نامعتبر)
    if (err.name === 'CastError') {
      return res.error('BAD_REQUEST', {
        message: `شناسه ارائه شده نامعتبر است: ${err.value}`,
        path: err.path,
        value: err.value
      });
    }
    
    // خطاهای محدودیت نرخ (اگر از express-rate-limit استفاده شود)
    if (err.name === 'RateLimitError') {
      return res.rateLimitExceeded(err.retryAfter);
    }
    
    // خطای پیش‌فرض
    return res.error('INTERNAL_SERVER_ERROR', {
      message: process.env.NODE_ENV === 'production' 
        ? 'خطای داخلی سرور رخ داده است' 
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
}

/**
 * میدلور برای اضافه کردن metadata به پاسخ‌ها
 * @returns {Function} - میدلور Express
 */
function metadataMiddleware() {
  return (req, res, next) => {
    // ذخیره metadata اصلی
    const originalJson = res.json;
    
    res.json = function(data) {
      // فقط اگر پاسخ استاندارد ما باشد، metadata اضافه کنیم
      if (data && typeof data === 'object' && 'success' in data) {
        data.metadata = {
          apiVersion: process.env.API_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || crypto.randomUUID?.() || Date.now()
        };
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  responseMiddleware,
  notFoundMiddleware,
  errorHandlerMiddleware,
  metadataMiddleware
};
