// @ts-nocheck
// ============================================
// 🎯 سیستم مدیریت پاسخ‌های یکپارچه با کدهای وضعیت HTTP
// ============================================

const messages = require('../constants/messages');
const { 
  HTTP_STATUS, 
  CUSTOM_STATUS, 
  getStatusByName, 
  getStatusByCode,
  getMessage as getStatusMessage,
  getDescription as getStatusDescription,
  createResponse as createStatusResponse,
  isValidStatusCode
} = require('../constants/http-status');

// ============================================
// ⚙️ تنظیمات پیش‌فرض
// ============================================

const DEFAULT_LANGUAGE = 'FA'; // حالا با سیستم کدهای وضعیت هماهنگ است
const SUPPORTED_LANGUAGES = ['FA', 'EN', 'AR'];

// ============================================
// 🏭 Factory برای ایجاد پاسخ
// ============================================

/**
 * دریافت زبان از درخواست
 * @param {object} req - شیء درخواست
 * @returns {string} زبان
 */
const getLanguage = (req) => {
  const lang = (req.headers['accept-language'] || req.query.lang || DEFAULT_LANGUAGE).toUpperCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
};

/**
 * دریافت پیام از فایل messages یا سیستم کدهای وضعیت
 * @param {string} key - کلید پیام یا نام کد وضعیت
 * @param {string} lang - زبان
 * @param {object} params - پارامترهای جایگزین
 * @returns {string} پیام
 */
const getMessage = (key, lang = DEFAULT_LANGUAGE, params = {}) => {
  // ابتدا از سیستم کدهای وضعیت بررسی کنیم
  const statusMessage = getStatusMessage(key, lang);
  if (statusMessage && statusMessage !== key) {
    return statusMessage;
  }
  
  // سپس از فایل messages
  const langMessages = messages[lang] || messages.FA;
  let message = langMessages[key] || messages.FA[key] || key;
  
  // جایگزینی پارامترها
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  
  return message;
};

/**
 * دریافت توضیحات از سیستم کدهای وضعیت
 * @param {string} key - نام کد وضعیت
 * @param {string} lang - زبان
 * @returns {string} توضیحات
 */
const getDescription = (key, lang = DEFAULT_LANGUAGE) => {
  return getStatusDescription(key, lang);
};

/**
 * دریافت اطلاعات کامل کد وضعیت
 * @param {string|number} identifier - نام یا کد وضعیت
 * @returns {object|null} اطلاعات کد وضعیت
 */
const getStatusInfo = (identifier) => {
  if (typeof identifier === 'number') {
    return getStatusByCode(identifier);
  }
  return getStatusByName(identifier);
};

/**
 * ایجاد پاسخ استاندارد با استفاده از سیستم کدهای وضعیت
 * @param {object} options - تنظیمات
 * @returns {object} پاسخ
 */
const createEnhancedResponse = (options = {}) => {
  const {
    success = true,
    statusName = 'OK', // نام کد وضعیت
    data = null,
    error = null,
    errors = null,
    statusCode = null, // اگر null باشد از statusName گرفته می‌شود
    requestId = null,
    language = DEFAULT_LANGUAGE,
    meta = null,
    timestamp = new Date().toISOString(),
    headers = {},
    pagination = null
  } = options;
  
  // دریافت اطلاعات کد وضعیت
  const statusInfo = getStatusInfo(statusName);
  const finalStatusCode = statusCode || (statusInfo ? statusInfo.code : 200);
  const finalSuccess = success && finalStatusCode < 400;
  
  // ساخت پاسخ
  const response = {
    success: finalSuccess,
    code: finalStatusCode,
    name: statusInfo ? statusInfo.name : statusName,
    message: statusInfo ? getMessage(statusInfo.name, language) : 'Unknown Status',
    ...(statusInfo && { description: getDescription(statusInfo.name, language) }),
    ...(data !== null && { data }),
    ...(error && { error }),
    ...(errors && { errors }),
    ...(meta && { meta }),
    ...(pagination && { pagination }),
    timestamp,
    ...(requestId && { requestId })
  };
  
  return {
    response,
    statusCode: finalStatusCode,
    headers
  };
};

// ============================================
// 📝 پاسخ‌های اصلی - نسخه یکپارچه‌شده
// ============================================

/**
 * پاسخ موفقیت با استفاده از کدهای وضعیت
 */
const successResponse = (res, data = null, statusName = 'OK', options = {}) => {
  const { requestId, meta, lang, pagination, headers } = options;
  const language = lang || getLanguage(res.req);
  
  const { response, statusCode, headers: responseHeaders } = createEnhancedResponse({
    success: true,
    statusName,
    data,
    requestId: requestId || res.req?.requestId,
    language,
    meta,
    pagination,
    headers: responseHeaders
  });
  
  // تنظیم هدرها
  if (responseHeaders) {
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  // هدرهای امنیتی
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ خطا با استفاده از کدهای وضعیت
 */
const errorResponse = (res, statusName = 'INTERNAL_SERVER_ERROR', errorDetails = null, options = {}) => {
  const { requestId, lang, statusCode, headers } = options;
  const language = lang || getLanguage(res.req);
  
  const { response, statusCode: finalStatusCode } = createEnhancedResponse({
    success: false,
    statusName,
    error: errorDetails,
    statusCode,
    requestId: requestId || res.req?.requestId,
    language,
    headers
  });
  
  return res.status(finalStatusCode).json(response);
};

/**
 * پاسخ اعتبارسنجی - استفاده از VALIDATION_ERROR
 */
const validationErrorResponse = (res, errors, options = {}) => {
  const { requestId, lang, statusName = 'VALIDATION_ERROR' } = options;
  const language = lang || getLanguage(res.req);
  
  // فرمت‌بندی خطاها
  const formattedErrors = Array.isArray(errors) ? 
    errors.map(err => ({
      field: err.field || err.path || 'unknown',
      message: err.message || err.msg || err,
      type: err.type || 'field',
      code: err.code || 'invalid'
    })) : 
    [{ message: errors }];
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName,
    errors: formattedErrors,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ عدم دسترسی (401)
 */
const unauthorizedResponse = (res, statusName = 'UNAUTHORIZED', options = {}) => {
  const { requestId, lang, challenge, details } = options;
  const language = lang || getLanguage(res.req);
  
  const errorDetails = details ? { details } : null;
  if (challenge) {
    res.setHeader('WWW-Authenticate', challenge);
  }
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName,
    error: errorDetails,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ forbidden (403)
 */
const forbiddenResponse = (res, statusName = 'FORBIDDEN', options = {}) => {
  const { requestId, lang, requiredPermission, currentPermissions, resource } = options;
  const language = lang || getLanguage(res.req);
  
  const details = {};
  if (requiredPermission) details.requiredPermission = requiredPermission;
  if (currentPermissions) details.currentPermissions = currentPermissions;
  if (resource) details.resource = resource;
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName,
    error: Object.keys(details).length > 0 ? { details } : null,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ یافت نشد (404)
 */
const notFoundResponse = (res, resource = 'resource', options = {}) => {
  const { requestId, lang, id } = options;
  const language = lang || getLanguage(res.req);
  
  const details = { resource };
  if (id) details.id = id;
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName: 'NOT_FOUND',
    error: { details },
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ صفحه‌بندی شده
 */
const paginatedResponse = (res, items, paginationInfo, statusName = 'OK', options = {}) => {
  const { requestId, lang, meta, headers } = options;
  const language = lang || getLanguage(res.req);
  
  const {
    page = 1,
    limit = 20,
    total = 0,
    totalPages = Math.ceil(total / limit),
    hasNextPage = page < totalPages,
    hasPrevPage = page > 1,
    nextPage = hasNextPage ? page + 1 : null,
    prevPage = hasPrevPage ? page - 1 : null
  } = paginationInfo;
  
  const pagination = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    links: {
      self: `${res.req?.originalUrl || res.req?.url}?page=${page}&limit=${limit}`,
      next: nextPage ? `${res.req?.originalUrl || res.req?.url}?page=${nextPage}&limit=${limit}` : null,
      prev: prevPage ? `${res.req?.originalUrl || res.req?.url}?page=${prevPage}&limit=${limit}` : null,
      first: `${res.req?.originalUrl || res.req?.url}?page=1&limit=${limit}`,
      last: `${res.req?.originalUrl || res.req?.url}?page=${totalPages}&limit=${limit}`
    }
  };
  
  // هدرهای pagination
  res.setHeader('X-Pagination-Page', page);
  res.setHeader('X-Pagination-Limit', limit);
  res.setHeader('X-Pagination-Total', total);
  res.setHeader('X-Pagination-TotalPages', totalPages);
  
  const { response, statusCode } = createEnhancedResponse({
    success: true,
    statusName,
    data: items,
    pagination,
    requestId: requestId || res.req?.requestId,
    language,
    meta,
    headers
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ Created (201)
 */
const createdResponse = (res, data, statusName = 'CREATED', options = {}) => {
  return successResponse(res, data, statusName, options);
};

/**
 * پاسخ No Content (204)
 */
const noContentResponse = (res, options = {}) => {
  const { headers } = options;
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  return res.status(204).send();
};

/**
 * پاسخ Accepted (202)
 */
const acceptedResponse = (res, data = null, statusName = 'ACCEPTED', options = {}) => {
  return successResponse(res, data, statusName, options);
};

/**
 * پاسخ با کد سفارشی
 */
const customResponse = (res, statusCode, responseData = {}) => {
  const isValid = isValidStatusCode(statusCode);
  
  if (!isValid) {
    console.warn(`⚠️ کد وضعیت سفارشی ${statusCode} در سیستم استاندارد تعریف نشده است`);
  }
  
  const response = {
    success: statusCode < 400,
    code: statusCode,
    timestamp: new Date().toISOString(),
    ...responseData
  };
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ کش شده
 */
const cachedResponse = (res, data, options = {}) => {
  const {
    maxAge = 3600,
    etag,
    lastModified = new Date(),
    statusName = 'OK',
    lang,
    requestId
  } = options;
  
  const language = lang || getLanguage(res.req);
  
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  res.setHeader('Last-Modified', lastModified.toUTCString());
  
  if (etag) {
    res.setHeader('ETag', etag);
    // بررسی If-None-Match
    if (res.req?.headers['if-none-match'] === etag) {
      return res.status(304).send();
    }
  }
  
  const { response, statusCode } = createEnhancedResponse({
    success: true,
    statusName,
    data,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

// ============================================
// 🆕 پاسخ‌های جدید با استفاده از کدهای وضعیت
// ============================================

/**
 * پاسخ Bad Request (400)
 */
const badRequestResponse = (res, details = null, statusName = 'BAD_REQUEST', options = {}) => {
  return errorResponse(res, statusName, details, options);
};

/**
 * پاسخ Payment Required (402)
 */
const paymentRequiredResponse = (res, details = null, options = {}) => {
  return errorResponse(res, 'PAYMENT_REQUIRED', details, options);
};

/**
 * پاسخ Conflict (409)
 */
const conflictResponse = (res, details = null, options = {}) => {
  return errorResponse(res, 'CONFLICT', details, options);
};

/**
 * پاسخ Gone (410)
 */
const goneResponse = (res, resource = 'resource', options = {}) => {
  const { lang, requestId } = options;
  const language = lang || getLanguage(res.req);
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName: 'GONE',
    error: { details: { resource } },
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ Too Many Requests (429)
 */
const tooManyRequestsResponse = (res, retryAfter = 60, options = {}) => {
  const { requestId, lang, details } = options;
  const language = lang || getLanguage(res.req);
  
  res.setHeader('Retry-After', retryAfter.toString());
  
  const errorDetails = {
    retryAfter,
    ...(details && { details })
  };
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName: 'TOO_MANY_REQUESTS',
    error: errorDetails,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ Service Unavailable (503)
 */
const serviceUnavailableResponse = (res, retryAfter = 300, options = {}) => {
  const { requestId, lang, details } = options;
  const language = lang || getLanguage(res.req);
  
  res.setHeader('Retry-After', retryAfter.toString());
  
  const errorDetails = {
    retryAfter,
    ...(details && { details })
  };
  
  const { response, statusCode } = createEnhancedResponse({
    success: false,
    statusName: 'SERVICE_UNAVAILABLE',
    error: errorDetails,
    requestId: requestId || res.req?.requestId,
    language
  });
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ Gateway Timeout (504)
 */
const gatewayTimeoutResponse = (res, options = {}) => {
  return errorResponse(res, 'GATEWAY_TIMEOUT', null, options);
};

/**
 * پاسخ از خطا (Error Object)
 */
const errorFromException = (res, error, options = {}) => {
  const { defaultStatus = 'INTERNAL_SERVER_ERROR', lang, requestId } = options;
  const language = lang || getLanguage(res.req);
  
  let statusName = defaultStatus;
  let errorDetails = {
    message: error.message,
    name: error.name,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
  
  // تشخیص نوع خطا
  if (error.name === 'ValidationError') {
    statusName = 'VALIDATION_ERROR';
    const errors = Object.values(error.errors || {}).map(err => ({
      field: err.path,
      message: err.message,
      type: err.kind
    }));
    errorDetails = { errors };
  } else if (error.name === 'JsonWebTokenError') {
    statusName = 'TOKEN_INVALID';
  } else if (error.name === 'TokenExpiredError') {
    statusName = 'TOKEN_EXPIRED';
  } else if (error.code === 11000) { // MongoDB duplicate key
    statusName = 'CONFLICT';
    const field = Object.keys(error.keyPattern || {})[0];
    errorDetails = {
      message: `رکورد با ${field} = ${error.keyValue?.[field]} از قبل وجود دارد`,
      field,
      value: error.keyValue?.[field]
    };
  } else if (error.name === 'CastError') {
    statusName = 'BAD_REQUEST';
    errorDetails = {
      message: `شناسه ارائه شده نامعتبر است: ${error.value}`,
      path: error.path
    };
  } else if (error.name === 'RateLimitError') {
    statusName = 'TOO_MANY_REQUESTS';
    errorDetails = {
      retryAfter: error.retryAfter,
      message: 'تعداد درخواست‌های شما از حد مجاز فراتر رفته است'
    };
  }
  
  return errorResponse(res, statusName, errorDetails, {
    ...options,
    lang: language,
    requestId: requestId || res.req?.requestId
  });
};

// ============================================
// 🧰 Utility Functions
// ============================================

/**
 * بررسی آیا پاسخ موفقیت‌آمیز است
 */
const isSuccessResponse = (statusCode) => {
  return statusCode >= 200 && statusCode < 300;
};

/**
 * بررسی آیا پاسخ خطای کلاینت است
 */
const isClientError = (statusCode) => {
  return statusCode >= 400 && statusCode < 500;
};

/**
 * بررسی آیا پاسخ خطای سرور است
 */
const isServerError = (statusCode) => {
  return statusCode >= 500;
};

/**
 * ایجاد هدرهای استاندارد برای پاسخ
 */
const setStandardHeaders = (res, options = {}) => {
  const {
    contentType = 'application/json; charset=utf-8',
    cacheControl,
    allowOrigin = '*',
    allowMethods = 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    allowHeaders = 'Content-Type, Authorization, Accept-Language'
  } = options;
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', allowMethods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  if (cacheControl) {
    res.setHeader('Cache-Control', cacheControl);
  }
};

/**
 * ایجاد middleware برای پاسخ‌های استاندارد
 */
const responseMiddleware = () => {
  return (req, res, next) => {
    // ذخیره زمان شروع درخواست
    req.startTime = Date.now();
    
    // اضافه کردن متدهای پاسخ به res
    res.respond = (statusName, data = null, options = {}) => {
      return successResponse(res, data, statusName, options);
    };
    
    res.success = (data = null, statusName = 'OK', options = {}) => {
      return successResponse(res, data, statusName, options);
    };
    
    res.error = (statusName, errorDetails = null, options = {}) => {
      return errorResponse(res, statusName, errorDetails, options);
    };
    
    res.validationError = (errors, options = {}) => {
      return validationErrorResponse(res, errors, options);
    };
    
    res.unauthorized = (options = {}) => {
      return unauthorizedResponse(res, 'UNAUTHORIZED', options);
    };
    
    res.forbidden = (options = {}) => {
      return forbiddenResponse(res, 'FORBIDDEN', options);
    };
    
    res.notFound = (resource = 'resource', options = {}) => {
      return notFoundResponse(res, resource, options);
    };
    
    res.created = (data, options = {}) => {
      return createdResponse(res, data, 'CREATED', options);
    };
    
    res.noContent = (options = {}) => {
      return noContentResponse(res, options);
    };
    
    res.paginated = (items, paginationInfo, statusName = 'OK', options = {}) => {
      return paginatedResponse(res, items, paginationInfo, statusName, options);
    };
    
    res.fromError = (error, options = {}) => {
      return errorFromException(res, error, options);
    };
    
    next();
  };
};

// ============================================
// 📤 خروجی ماژول
// ============================================

module.exports = {
  // پاسخ‌های اصلی
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  acceptedResponse,
  customResponse,
  cachedResponse,
  
  // پاسخ‌های جدید
  badRequestResponse,
  paymentRequiredResponse,
  conflictResponse,
  goneResponse,
  tooManyRequestsResponse,
  serviceUnavailableResponse,
  gatewayTimeoutResponse,
  errorFromException,
  
  // Utility functions
  getLanguage,
  getMessage,
  getDescription,
  getStatusInfo,
  createEnhancedResponse,
  isSuccessResponse,
  isClientError,
  isServerError,
  setStandardHeaders,
  responseMiddleware,
  
  // برای سازگاری با نسخه قدیمی
  dataResponse: (res, data, statusCode = 200, options = {}) => {
    const statusInfo = getStatusByCode(statusCode);
    const statusName = statusInfo ? statusInfo.name : 'OK';
    return successResponse(res, data, statusName, options);
  },
  
  streamResponse: (res, stream, options = {}) => {
    const {
      filename = 'file',
      contentType = 'application/octet-stream',
      contentLength,
      lastModified = new Date()
    } = options;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Last-Modified', lastModified.toUTCString());
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    stream.pipe(res);
  },
  
  downloadResponse: (res, filePath, filename, options = {}) => {
    const { contentType = 'application/octet-stream' } = options;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    return res.download(filePath, filename);
  }
};
