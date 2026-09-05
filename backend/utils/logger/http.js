// utils/logger/http.js

const morgan = require('morgan');
const uuid = require('uuid');
const os = require('os');
const config = require('../../config');
const consoleLogger = require('./console');
const fileLogger = require('./file');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // آستانه زمان پاسخ آهسته (ms)
  slowRequestThreshold: config.log?.http?.slowThreshold || 1000,
  
  // حداکثر طول body برای لاگ
  maxBodyLength: config.log?.http?.maxBodyLength || 1000,
  
  // لاگ کردن body درخواست
  logRequestBody: config.log?.http?.logRequestBody ?? true,
  
  // لاگ کردن body پاسخ
  logResponseBody: config.log?.http?.logResponseBody ?? false,
  
  // لاگ کردن headers
  logHeaders: config.log?.http?.logHeaders ?? false,
  
  // فیلتر کردن فیلدهای حساس
  sensitiveFields: ['password', 'token', 'authorization', 'secret', 'apiKey', 'creditCard'],
  
  // رنگ‌های status
  statusColors: {
    success: '\x1b[32m',    // 2xx - سبز
    redirect: '\x1b[36m',   // 3xx - آبی
    clientError: '\x1b[33m', // 4xx - زرد
    serverError: '\x1b[31m', // 5xx - قرمز
    info: '\x1b[35m',       // 1xx - بنفش
  },
  
  // مسیرهایی که لاگ نشوند
  excludePaths: ['/health', '/healthcheck', '/ping', '/favicon.ico'],
};

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * فیلتر کردن داده‌های حساس
 */
function filterSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  for (const key of Object.keys(filtered)) {
    if (CONFIG.sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '***HIDDEN***';
    }
  }
  return filtered;
}

/**
 * بررسی آهسته بودن درخواست
 */
function isSlowRequest(responseTime) {
  return responseTime > CONFIG.slowRequestThreshold;
}

/**
 * دریافت رنگ بر اساس status code
 */
function getStatusColor(status) {
  if (status >= 500) return CONFIG.statusColors.serverError;
  if (status >= 400) return CONFIG.statusColors.clientError;
  if (status >= 300) return CONFIG.statusColors.redirect;
  if (status >= 200) return CONFIG.statusColors.success;
  if (status >= 100) return CONFIG.statusColors.info;
  return '\x1b[0m';
}

/**
 * فرمت کردن اندازه
 */
function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = parseInt(bytes);
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * دریافت اطلاعات کلاینت
 */
function getClientInfo(req) {
  return {
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    ips: req.ips || [],
    userAgent: req.get('user-agent') || 'unknown',
    referer: req.get('referer') || req.get('referrer') || '-',
    accept: req.get('accept') || '-',
    acceptLanguage: req.get('accept-language') || '-',
    acceptEncoding: req.get('accept-encoding') || '-',
  };
}

// ═══════════════════════════════════════════════════════════════
// Custom Morgan Tokens
// ═══════════════════════════════════════════════════════════════

morgan.token('id', (req) => req.id || uuid.v4());
morgan.token('user-id', (req) => req.user?.id || req.userId || '-');
morgan.token('username', (req) => req.user?.username || req.username || '-');
morgan.token('correlation-id', (req) => req.correlationId || req.get('x-correlation-id') || '-');
morgan.token('request-id', (req) => req.requestId || req.get('x-request-id') || '-');
morgan.token('body', (req) => {
  if (!CONFIG.logRequestBody || !req.body) return '-';
  const body = filterSensitiveData(req.body);
  const str = JSON.stringify(body);
  return str.length > CONFIG.maxBodyLength 
    ? str.substring(0, CONFIG.maxBodyLength) + '...' 
    : str;
});
morgan.token('response-body', (res) => {
  if (!CONFIG.logResponseBody || !res.locals.body) return '-';
  const body = filterSensitiveData(res.locals.body);
  const str = JSON.stringify(body);
  return str.length > CONFIG.maxBodyLength 
    ? str.substring(0, CONFIG.maxBodyLength) + '...' 
    : str;
});
morgan.token('req-headers', (req) => {
  if (!CONFIG.logHeaders) return '-';
  return JSON.stringify(filterSensitiveData(req.headers));
});
morgan.token('res-headers', (req, res) => {
  if (!CONFIG.logHeaders) return '-';
  const headers = {};
  res.getHeaderNames().forEach(name => {
    headers[name] = res.getHeader(name);
  });
  return JSON.stringify(headers);
});
morgan.token('slow', (req, res) => {
  const responseTime = parseFloat(morgan['response-time'](req, res)) || 0;
  return responseTime > CONFIG.slowRequestThreshold ? '🐢 SLOW' : '';
});
morgan.token('color-status', (req, res) => {
  const status = res.statusCode;
  const color = getStatusColor(status);
  return `${color}${status}\x1b[0m`;
});

// ═══════════════════════════════════════════════════════════════
// Format Definitions
// ═══════════════════════════════════════════════════════════════

const FORMATS = {
  // فرمت توسعه (خوانا)
  dev: morgan(function devFormat(tokens, req, res) {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens['color-status'](req, res);
    const responseTime = tokens['response-time'](req, res);
    const slow = tokens['slow'](req, res);
    const size = tokens.res(req, res, 'content-length') || '0';
    const userId = tokens['user-id'](req, res);
    
    // ایموجی بر اساس متد
    const methodEmojis = {
      GET: '🔍',
      POST: '➕',
      PUT: '✏️',
      PATCH: '🔄',
      DELETE: '🗑️',
      OPTIONS: '⚙️',
      HEAD: '📄',
    };
    const emoji = methodEmojis[method] || '📌';
    
    return [
      `${emoji} ${method}`,
      url,
      status,
      `${responseTime}ms`,
      size !== '-' ? formatSize(size) : '-',
      slow,
      userId !== '-' ? `👤 ${userId}` : '',
    ].filter(Boolean).join(' | ');
  }),
  
  // فرمت JSON (برای فایل)
  json: morgan(function jsonFormat(tokens, req, res) {
    return JSON.stringify({
      id: tokens.id(req, res),
      correlationId: tokens['correlation-id'](req, res),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res)),
      responseTime: parseFloat(tokens['response-time'](req, res)),
      contentLength: tokens.res(req, res, 'content-length'),
      timestamp: new Date().toISOString(),
      client: getClientInfo(req),
      user: {
        id: tokens['user-id'](req, res),
        username: tokens['username'](req, res),
      },
      request: {
        body: tokens.body(req, res),
        headers: tokens['req-headers'](req, res),
      },
      response: {
        body: tokens['response-body'](req, res),
        headers: tokens['res-headers'](req, res),
      },
      slow: isSlowRequest(parseFloat(tokens['response-time'](req, res))),
    });
  }),
  
  // فرمت فشرده
  tiny: morgan(':method :url :status :response-time ms :res[content-length]'),
  
  // فرمت کامل
  combined: morgan(':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'),
  
  // فرمت سفارشی
  custom: morgan(function customFormat(tokens, req, res) {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens['response-time'](req, res);
    const size = tokens.res(req, res, 'content-length');
    const userId = tokens['user-id'](req, res);
    const correlationId = tokens['correlation-id'](req, res);
    
    return JSON.stringify({
      id: tokens.id(req, res),
      correlationId,
      method,
      url,
      status: parseInt(status),
      responseTime: `${responseTime}ms`,
      contentLength: size,
      userId,
      slow: isSlowRequest(parseFloat(responseTime)),
    });
  }),
};

// ═══════════════════════════════════════════════════════════════
// HTTP Logger Class
// ═══════════════════════════════════════════════════════════════

class HttpLogger {
  constructor() {
    this.config = CONFIG;
    this.requestCount = 0;
    this.slowRequests = [];
    this.errors = [];
    this.startTime = Date.now();
    
    // Initialize formats
    this.devFormat = FORMATS.dev;
    this.jsonFormat = FORMATS.json;
    this.customFormat = FORMATS.custom;
    
    // Create middleware
    this.middleware = this.createMiddleware();
    this.errorMiddleware = this.createErrorMiddleware();
  }

  // ─────────────────────────────────────────────────────────────
  // Middleware Creation
  // ─────────────────────────────────────────────────────────────

  createMiddleware() {
    // استفاده از فرمت مناسب بر اساس محیط
    const format = config.env === 'development' ? this.devFormat : this.jsonFormat;
    
    return morgan(format, {
      // فیلتر کردن مسیرها
      skip: (req) => {
        return CONFIG.excludePaths.some(path => req.path.startsWith(path));
      },
      
      // stream سفارشی
      stream: {
        write: (message) => {
          this.handleLog(message);
        }
      }
    });
  }

  /**
   * Middleware برای لاگ خطاها
   */
  createErrorMiddleware() {
    return (err, req, res, next) => {
      const errorLog = {
        id: req.id || uuid.v4(),
        correlationId: req.correlationId || req.get('x-correlation-id'),
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        error: {
          name: err.name,
          message: err.message,
          stack: config.env === 'development' ? err.stack : undefined,
        },
        client: getClientInfo(req),
        user: {
          id: req.user?.id,
          username: req.user?.username,
        },
        request: {
          body: CONFIG.logRequestBody ? filterSensitiveData(req.body) : undefined,
          headers: CONFIG.logHeaders ? filterSensitiveData(req.headers) : undefined,
        },
      };
      
      // لاگ در کنسول
      consoleLogger.error(`❌ ${req.method} ${req.url} - ${err.message}`, {
        error: err.name,
        stack: err.stack,
        userId: req.user?.id,
      });
      
      // لاگ در فایل
      fileLogger.error(`HTTP Error: ${req.method} ${req.url}`, errorLog);
      
      // ذخیره در آرایه خطاها
      this.errors.push(errorLog);
      if (this.errors.length > 1000) {
        this.errors.shift();
      }
      
      next(err);
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Log Handling
  // ─────────────────────────────────────────────────────────────

  handleLog(message) {
    try {
      const data = JSON.parse(message);
      
      // افزایش شمارنده
      this.requestCount++;
      
      // بررسی درخواست آهسته
      if (data.slow || (data.responseTime && parseFloat(data.responseTime) > CONFIG.slowRequestThreshold)) {
        this.handleSlowRequest(data);
      }
      
      // بررسی خطا
      if (data.status >= 400) {
        this.handleError(data);
      }
      
      // لاگ در کنسول (فقط در توسعه)
      if (config.env === 'development') {
        this.logToConsole(data);
      }
      
      // لاگ در فایل
      this.logToFile(data);
      
    } catch (error) {
      consoleLogger.error('Error parsing HTTP log', { error: error.message });
    }
  }

  /**
   * لاگ در کنسول
   */
  logToConsole(data) {
    const { method, url, status, responseTime, contentLength, userId } = data;
    const color = getStatusColor(status);
    const size = contentLength ? formatSize(contentLength) : '-';
    
    // ایموجی بر اساس متد
    const methodEmojis = {
      GET: '🔍',
      POST: '➕',
      PUT: '✏️',
      PATCH: '🔄',
      DELETE: '🗑️',
    };
    const emoji = methodEmojis[method] || '📌';
    
    // لاگ آهسته با هشدار
    if (data.slow) {
      consoleLogger.warn(`🐢 Slow Request: ${method} ${url}`, {
        responseTime,
        threshold: `${CONFIG.slowRequestThreshold}ms`,
      });
    } else {
      console.log(
        `${emoji} ${method.padEnd(7)} ${url.substring(0, 50)} ${color}${status}\x1b[0m ` +
        `${responseTime}ms ${size} ${userId !== '-' ? `👤 ${userId}` : ''}`
      );
    }
  }

  /**
   * لاگ در فایل
   */
  logToFile(data) {
    const { method, url, status, responseTime, id, correlationId, client, user } = data;
    
    // استفاده از API logger فایل
    fileLogger.api(method, url, status, parseFloat(responseTime), {
      requestId: id,
      correlationId,
      ip: client?.ip,
      userAgent: client?.userAgent,
      userId: user?.id,
      contentLength: data.contentLength,
      slow: data.slow,
    });
  }

  /**
   * مدیریت درخواست آهسته
   */
  handleSlowRequest(data) {
    const slowLog = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    
    this.slowRequests.push(slowLog);
    if (this.slowRequests.length > 100) {
      this.slowRequests.shift();
    }
    
    // لاگ هشدار
    consoleLogger.warn(
      `⚠️ Slow Request Detected: ${data.method} ${data.url}`,
      {
        responseTime: data.responseTime,
        threshold: `${CONFIG.slowRequestThreshold}ms`,
        ip: data.client?.ip,
      }
    );
    
    // لاگ در فایل performance
    fileLogger.performance('slow-http-request', parseFloat(data.responseTime), {
      method: data.method,
      url: data.url,
      threshold: CONFIG.slowRequestThreshold,
    });
  }

  /**
   * مدیریت خطاها
   */
  handleError(data) {
    const level = data.status >= 500 ? 'error' : 'warn';
    
    fileLogger.log(level, `HTTP ${data.status}: ${data.method} ${data.url}`, {
      status: data.status,
      responseTime: data.responseTime,
      ip: data.client?.ip,
      userAgent: data.client?.userAgent,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Public Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * دریافت middleware
   */
  getMiddleware() {
    return this.middleware;
  }

  /**
   * دریافت error middleware
   */
  getErrorMiddleware() {
    return this.errorMiddleware;
  }

  /**
   * دریافت آمار
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const requestsPerSecond = (this.requestCount / (uptime / 1000)).toFixed(2);
    
    return {
      totalRequests: this.requestCount,
      uptime: `${Math.floor(uptime / 1000 / 60)} minutes`,
      requestsPerSecond: parseFloat(requestsPerSecond),
      slowRequestsCount: this.slowRequests.length,
      errorsCount: this.errors.length,
      recentSlowRequests: this.slowRequests.slice(-10),
      recentErrors: this.errors.slice(-10),
    };
  }

  /**
   * دریافت درخواست‌های آهسته
   */
  getSlowRequests(limit = 10) {
    return this.slowRequests.slice(-limit);
  }

  /**
   * دریافت خطاها
   */
  getErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  /**
   * ریست آمار
   */
  resetStats() {
    this.requestCount = 0;
    this.slowRequests = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  /**
   * تنظیم آستانه درخواست آهسته
   */
  setSlowThreshold(ms) {
    CONFIG.slowRequestThreshold = ms;
  }

  /**
   * افزودن مسیر به لیست исключения
   */
  addExcludePath(path) {
    CONFIG.excludePaths.push(path);
  }

  /**
   * حذف مسیر از لیست исключения
   */
  removeExcludePath(path) {
    CONFIG.excludePaths = CONFIG.excludePaths.filter(p => p !== path);
  }

  /**
   * دریافت فرمت سفارشی
   */
  getCustomFormat(formatName = 'dev') {
    return FORMATS[formatName] || FORMATS.dev;
  }

  /**
   * ایجاد middleware با فرمت سفارشی
   */
  createCustomMiddleware(formatName, options = {}) {
    const format = this.getCustomFormat(formatName);
    
    return morgan(format, {
      skip: options.skip || CONFIG.excludePaths.map(p => (req) => req.path.startsWith(p)),
      stream: options.stream || {
        write: (message) => this.handleLog(message),
      },
    });
  }

  /**
   * لاگ دستی HTTP
   */
  log(method, url, status, responseTime, meta = {}) {
    const data = {
      method,
      url,
      status,
      responseTime: `${responseTime}ms`,
      contentLength: meta.contentLength || '-',
      client: meta.client || {},
      user: meta.user || {},
      slow: responseTime > CONFIG.slowRequestThreshold,
      timestamp: new Date().toISOString(),
    };
    
    this.handleLog(JSON.stringify(data));
  }
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = new HttpLogger();