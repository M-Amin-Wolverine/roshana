// utils/response.js
const messages = require('../constants/messages');

// ============================================
// ⚙️ تنظیمات پیش‌فرض
// ============================================

const DEFAULT_LANGUAGE = 'fa';
const SUPPORTED_LANGUAGES = ['fa', 'en', 'ar'];

// ============================================
// 🏭 Factory برای ایجاد پاسخ
// ============================================

/**
 * دریافت زبان از درخواست
 * @param {object} req - شیء درخواست
 * @returns {string} زبان
 */
const getLanguage = (req) => {
  const lang = req.headers['accept-language'] || req.query.lang || DEFAULT_LANGUAGE;
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
};

/**
 * دریافت پیام از فایل messages
 * @param {string} key - کلید پیام
 * @param {string} lang - زبان
 * @param {object} params - پارامترهای جایگزین
 * @returns {string} پیام
 */
const getMessage = (key, lang = DEFAULT_LANGUAGE, params = {}) => {
  const langMessages = messages[lang.toUpperCase()] || messages.FA;
  let message = langMessages[key] || messages.FA[key] || key;
  
  // جایگزینی پارامترها
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  
  return message;
};

/**
 * ایجاد پاسخ استاندارد
 * @param {object} options - تنظیمات
 * @returns {object} پاسخ
 */
const createResponse = (options = {}) => {
  const {
    success = true,
    message = '',
    data = null,
    error = null,
    errors = null,
    statusCode = 200,
    requestId = null,
    language = DEFAULT_LANGUAGE,
    meta = null,
    timestamp = new Date().toISOString(),
    headers = {}
  } = options;

  const response = {
    success,
    ...(message && { message }),
    ...(data !== null && { data }),
    ...(error && { error }),
    ...(errors && { errors }),
    ...(meta && { meta }),
    timestamp
  };

  return { response, statusCode, headers };
};

// ============================================
// 📝 پاسخ‌های اصلی
// ============================================

/**
 * پاسخ موفقیت
 */
const successResponse = (res, data = null, message = 'SUCCESS', statusCode = 200, options = {}) => {
  const { requestId, meta, lang } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  const { response, statusCode: code, headers } = createResponse({
    success: true,
    message: localizedMessage,
    data,
    statusCode,
    requestId: requestId || res.req?.requestId,
    language,
    meta
  });
  
  // تنظیم هدرها
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  
  // هدرهای امنیتی
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  return res.status(code).json(response);
};

/**
 * پاسخ خطا
 */
const errorResponse = (res, message = 'ERROR', statusCode = 500, errorDetails = null, options = {}) => {
  const { requestId, lang, code } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  const errorResponseData = {
    success: false,
    message: localizedMessage,
    error: errorDetails?.code || code || 'internal_error',
    ...(errorDetails?.details && { details: errorDetails.details }),
    timestamp: new Date().toISOString()
  };
  
  if (requestId || res.req?.requestId) {
    errorResponseData.requestId = requestId || res.req.requestId;
  }
  
  return res.status(statusCode).json(errorResponseData);
};

/**
 * پاسخ اعتبارسنجی
 */
const validationErrorResponse = (res, errors, message = 'VALIDATION_ERROR', options = {}) => {
  const { requestId, lang } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  // فرمت‌بندی خطاها
  const formattedErrors = Array.isArray(errors) 
    ? errors.map(err => ({
        field: err.field || err.path || 'unknown',
        message: err.message || err.msg || err,
        type: err.type || 'field'
      }))
    : [{ message: errors }];
  
  const response = {
    success: false,
    message: localizedMessage,
    error: 'validation_error',
    errors: formattedErrors,
    timestamp: new Date().toISOString()
  };
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(400).json(response);
};

/**
 * پاسخ عدم دسترسی (401)
 */
const unauthorizedResponse = (res, message = 'UNAUTHORIZED', options = {}) => {
  const { requestId, lang, challenge } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  const response = {
    success: false,
    message: localizedMessage,
    error: 'unauthorized',
    timestamp: new Date().toISOString()
  };
  
  if (challenge) {
    response.challenge = challenge;
    res.setHeader('WWW-Authenticate', challenge);
  }
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(401).json(response);
};

/**
 * پاسخ forbidden (403)
 */
const forbiddenResponse = (res, message = 'FORBIDDEN', options = {}) => {
  const { requestId, lang, requiredRole, currentRole } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  const response = {
    success: false,
    message: localizedMessage,
    error: 'forbidden',
    timestamp: new Date().toISOString()
  };
  
  if (requiredRole) {
    response.requiredRole = requiredRole;
  }
  
  if (currentRole) {
    response.currentRole = currentRole;
  }
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(403).json(response);
};

/**
 * پاسخ یافت نشد (404)
 */
const notFoundResponse = res => (resource = 'resource', message = 'NOT_FOUND', options = {}) => {
  const { requestId, lang } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language, { resource });
  
  const response = {
    success: false,
    message: localizedMessage,
    error: 'not_found',
    timestamp: new Date().toISOString()
  };
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(404).json(response);
};

/**
 * پاسخ صفحه‌بندی شده
 */
const paginatedResponse = (res, data, pagination, message = 'SUCCESS', options = {}) => {
  const { requestId, lang, meta } = options;
  const language = lang || getLanguage(res.req);
  const localizedMessage = getMessage(message, language);
  
  const {
    page = 1,
    limit = 20,
    total = 0,
    totalPages = Math.ceil(total / limit),
    hasNextPage = page < totalPages,
    hasPrevPage = page > 1,
    nextPage = hasNextPage ? page + 1 : null,
    prevPage = hasPrevPage ? page - 1 : null
  } = pagination;
  
  const response = {
    success: true,
    message: localizedMessage,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      // لینک‌های صفحه‌بندی
      links: {
        self: `${res.req?.originalUrl || res.req?.url}?page=${page}&limit=${limit}`,
        next: nextPage ? `${res.req?.originalUrl || res.req?.url}?page=${nextPage}&limit=${limit}` : null,
        prev: prevPage ? `${res.req?.originalUrl || res.req?.url}?page=${prevPage}&limit=${limit}` : null,
        first: `${res.req?.originalUrl || res.req?.url}?page=1&limit=${limit}`,
        last: `${res.req?.originalUrl || res.req?.url}?page=${totalPages}&limit=${limit}`
      }
    },
    timestamp: new Date().toISOString()
  };
  
  // اضافه کردن meta اضافی
  if (meta) {
    response.meta = meta;
  }
  
  // هدرهای pagination
  res.setHeader('X-Pagination-Page', page);
  res.setHeader('X-Pagination-Limit', limit);
  res.setHeader('X-Pagination-Total', total);
  res.setHeader('X-Pagination-TotalPages', totalPages);
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(200).json(response);
};

/**
 * پاسخ فقط داده (بدون message)
 */
const dataResponse = (res, data, statusCode = 200, options = {}) => {
  const { requestId, meta } = options;
  
  const response = {
    success: true,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString()
  };
  
  if (requestId || res.req?.requestId) {
    response.requestId = requestId || res.req.requestId;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * پاسخ Created (201)
 */
const createdResponse = (res, data, message = 'CREATED', options = {}) => {
  return successResponse(res, data, message, 201, options);
};

/**
 * پاسخ No Content (204)
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * پاسخ Accepted (202)
 */
const acceptedResponse = (res, message = 'ACCEPTED', options = {}) => {
  return successResponse(res, null, message, 202, options);
};

/**
 * پاسخ با کد سفارشی
 */
const customResponse = (res, statusCode, responseData) => {
  return res.status(statusCode).json({
    ...responseData,
    timestamp: new Date().toISOString()
  });
};

/**
 * پاسخ stream (برای فایل‌ها)
 */
const streamResponse = (res, stream, options = {}) => {
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
};

/**
 * پاسخ دانلود فایل
 */
const downloadResponse = (res, filePath, filename, options = {}) => {
  const {
    contentType = 'application/octet-stream'
  } = options;
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);
  
  return res.download(filePath, filename);
};

/**
 * پاسخ کش شده
 */
const cachedResponse = (res, data, options = {}) => {
  const {
    maxAge = 3600, // 1 ساعت پیش‌فرض
    etag,
    lastModified = new Date()
  } = options;
  
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  res.setHeader('Last-Modified', lastModified.toUTCString());
  
  if (etag) {
    res.setHeader('ETag', etag);
    
    // بررسی If-None-Match
    if (res.req?.headers['if-none-match'] === etag) {
      return res.status(304).send();
    }
  }
  
  return res.status(200).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
};

// ============================================
// 📤 خروجی ماژول
// ============================================

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  dataResponse,
  createdResponse,
  noContentResponse,
  acceptedResponse,
  customResponse,
  streamResponse,
  downloadResponse,
  cachedResponse,
  getLanguage,
  getMessage,
  createResponse
};