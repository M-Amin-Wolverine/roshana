// middleware/loggerMiddleware.js

const os = require('os');
const uuid = require('uuid');
const bytes = require('bytes');
const logger = require('../utils/logger');
const { v4: uuidv4 } = uuid;

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // مسیرهای مستثنی
  excludePaths: ['/health', '/healthcheck', '/ping', '/favicon.ico', '/metrics'],
  
  // مسیرهای مستثنی با الگو (regex)
  excludePatterns: [/^\/api\/internal\//],
  
  // فیلدهای حساس برای فیلتر کردن
  sensitiveFields: ['password', 'token', 'authorization', 'secret', 'apiKey', 'apikey', 'credit_card', 'cvv'],
  
  // آستانه درخواست آهسته (ms)
  slowRequestThreshold: 1000,
  
  // حداکثر طول body برای لاگ
  maxBodyLength: 1000,
  
  // لاگ کردن body درخواست
  logRequestBody: true,
  
  // لاگ کردن body پاسخ
  logResponseBody: false,
  
  // لاگ کردن headers
  logHeaders: false,
  
  // لاگ کردن query params
  logQuery: true,
  
  // لاگ کردن IP واقعی (از proxy)
  trustProxy: true,
  
  // فرمت زمان
  durationUnit: 'ms', // 'ms', 's', 'auto'
  
  // لاگ کردن درخواست‌های آهسته
  logSlowRequests: true,
  
  // لاگ کردن تمام درخواست‌ها (حتی موفق)
  logAllRequests: true,
  
  // استفاده از short URL (بدون query string)
  shortUrl: false,
  
  // نمایش رنگ در کنسول (فقط dev)
  colors: true,
};

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * فیلتر کردن داده‌های حساس
 */
function filterSensitiveData(data, depth = 0) {
  if (!data || typeof data !== 'object' || depth > 2) return data;
  
  const filtered = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (CONFIG.sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '***HIDDEN***';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value, depth + 1);
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * فرمت کردن مدت زمان
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * دریافت IP واقعی
 */
function getRealIP(req) {
  if (CONFIG.trustProxy) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * بررسی مستثنی بودن مسیر
 */
function shouldSkip(req) {
  const path = req.path || req.url;
  
  // Check exact paths
  if (CONFIG.excludePaths.some(p => path === p || path.startsWith(p))) {
    return true;
  }
  
  // Check patterns
  for (const pattern of CONFIG.excludePatterns) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * دریافت رنگ بر اساس status
 */
function getStatusColor(status) {
  if (status >= 500) return '\x1b[31m'; // قرمز
  if (status >= 400) return '\x1b[33m'; // زرد
  if (status >= 300) return '\x1b[36m'; // آبی
  if (status >= 200) return '\x1b[32m'; // سبز
  return '\x1b[0m';
}

/**
 * دریافت ایموجی بر اساس متد
 */
function getMethodEmoji(method) {
  const emojis = {
    GET: '🔍',
    POST: '➕',
    PUT: '✏️',
    PATCH: '🔄',
    DELETE: '🗑️',
    OPTIONS: '⚙️',
    HEAD: '📄',
    CONNECT: '🔗',
    TRACE: '🔎',
  };
  return emojis[method] || '📌';
}

/**
 * دریافت ایموجی بر اساس status
 */
function getStatusEmoji(status) {
  if (status >= 500) return '💥';
  if (status >= 400) return '⚠️';
  if (status >= 300) return '↔️';
  if (status >= 200) return '✅';
  return '📌';
}

/**
 * کوتاه کردن URL
 */
function getShortUrl(req) {
  const url = req.originalUrl || req.url;
  const parsed = new URL(url, 'http://localhost');
  return parsed.pathname;
}

/**
 * فرمت کردن اندازه
 */
function formatSize(bytes) {
  if (!bytes) return '-';
  return bytes(bytes);
}

/**
 * دریافت اطلاعات کلاینت کامل
 */
function getClientInfo(req) {
  return {
    ip: getRealIP(req),
    ips: req.ips || [],
    port: req.socket?.remotePort,
    method: req.method,
    protocol: req.protocol,
    secure: req.secure,
    host: req.get('host'),
    userAgent: req.get('user-agent'),
    referer: req.get('referer') || req.get('referrer'),
    accept: req.get('accept'),
    acceptLanguage: req.get('accept-language'),
    acceptEncoding: req.get('accept-encoding'),
    origin: req.get('origin'),
  };
}

/**
 * دریافت اطلاعات سرور
 */
function getServerInfo() {
  return {
    hostname: os.hostname(),
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Request/Response Log Builder
// ═══════════════════════════════════════════════════════════════

class RequestLogBuilder {
  constructor(req) {
    this.req = req;
    this.startTime = null;
    this.endTime = null;
    this.error = null;
    this.responseData = null;
  }

  setStartTime(time) {
    this.startTime = time;
  }

  setEndTime(time) {
    this.endTime = time;
  }

  setError(error) {
    this.error = error;
  }

  setResponseData(data) {
    this.responseData = data;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return this.endTime - this.startTime;
  }

  buildRequestLog() {
    const url = CONFIG.shortUrl ? getShortUrl(this.req) : (this.req.originalUrl || this.req.url);
    
    const log = {
      id: this.req.id,
      correlationId: this.req.correlationId,
      method: this.req.method,
      url,
      path: this.req.path,
      query: CONFIG.logQuery ? this.req.query : undefined,
      params: this.req.params,
      headers: CONFIG.logHeaders ? this.req.headers : undefined,
      body: CONFIG.logRequestBody ? filterSensitiveData(this.req.body) : undefined,
      client: getClientInfo(this.req),
      timestamp: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(log).forEach(key => {
      if (log[key] === undefined) delete log[key];
    });

    return log;
  }

  buildResponseLog() {
    const duration = this.getDuration();
    const url = CONFIG.shortUrl ? getShortUrl(this.req) : (this.req.originalUrl || this.req.url);
    
    const log = {
      id: this.req.id,
      correlationId: this.req.correlationId,
      method: this.req.method,
      url,
      status: this.req.res?.statusCode,
      duration: formatDuration(duration),
      durationMs: duration,
      slow: duration > CONFIG.slowRequestThreshold,
      contentLength: this.req.res?.getHeader('content-length'),
      client: getClientInfo(this.req),
      error: this.error ? {
        name: this.error.name,
        message: this.error.message,
        stack: CONFIG.logHeaders ? this.error.stack : undefined,
      } : undefined,
      timestamp: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(log).forEach(key => {
      if (log[key] === undefined) delete log[key];
    });

    return log;
  }

  buildCompleteLog() {
    return {
      request: this.buildRequestLog(),
      response: this.buildResponseLog(),
      server: getServerInfo(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Enhanced Middleware
// ═══════════════════════════════════════════════════════════════

const loggerMiddleware = (options = {}) => {
  // Merge options with config
  const config = { ...CONFIG, ...options };
  
  return (req, res, next) => {
    // Skip if path is excluded
    if (shouldSkip(req)) {
      return next();
    }

    // Generate request ID
    req.id = req.id || uuidv4();
    req.correlationId = req.headers['x-correlation-id'] || req.id;
    
    // Set logger in request
    req.logger = logger.withCorrelation(req.correlationId).child({
      requestId: req.id,
      method: req.method,
      path: req.path,
    });

    // Create log builder
    const logBuilder = new RequestLogBuilder(req);
    const startTime = process.hrtime.bigint();
    req.startTime = startTime;

    // ═══════════════════════════════════════════════════════════
    // Request Log
    // ═══════════════════════════════════════════════════════════

    const requestMeta = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: config.logQuery ? req.query : undefined,
      params: req.params,
      ip: getRealIP(req),
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId,
      requestId: req.id,
    };

    // Add body if enabled and exists
    if (config.logRequestBody && req.body) {
      requestMeta.body = filterSensitiveData(req.body);
    }

    // Add headers if enabled
    if (config.logHeaders) {
      requestMeta.headers = filterSensitiveData(req.headers);
    }

    // Log incoming request
    if (config.logAllRequests) {
      const emoji = getMethodEmoji(req.method);
      logger.http(`${emoji} ${req.method} ${req.path}`, requestMeta);
    }

    // ═══════════════════════════════════════════════════════════
    // Response Log
    // ═══════════════════════════════════════════════════════════

    const originalEnd = res.end;
    const responseData = [];
    
    res.end = function(chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);
      
      // Capture response data if needed
      if (chunk && config.logResponseBody) {
        try {
          responseData.push(chunk.toString());
        } catch (e) {
          // Ignore
        }
      }
    };

    // On response finish
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      const statusCode = res.statusCode;
      const isSlow = durationMs > config.slowRequestThreshold;
      const isError = statusCode >= 400;
      
      // Build response metadata
      const responseMeta = {
        status: statusCode,
        duration: formatDuration(durationMs),
        durationMs,
        ip: getRealIP(req),
        correlationId: req.correlationId,
        requestId: req.id,
        contentLength: res.getHeader('content-length'),
        slow: isSlow,
      };

      // Log based on status
      if (isError) {
        const level = statusCode >= 500 ? 'error' : 'warn';
        const emoji = getStatusEmoji(statusCode);
        logger.log(level, `${emoji} HTTP ${statusCode}: ${req.method} ${req.path}`, responseMeta);
      } else if (isSlow && config.logSlowRequests) {
        logger.warn(`🐢 Slow Request: ${req.method} ${req.path}`, {
          ...responseMeta,
          threshold: formatDuration(config.slowRequestThreshold),
        });
      } else if (config.logAllRequests) {
        // Log successful request with details
        const emoji = getMethodEmoji(req.method);
        const statusColor = config.colors ? getStatusColor(statusCode) : '';
        const reset = config.colors ? '\x1b[0m' : '';
        
        if (config.colors && config.logAllRequests) {
          console.log(
            `${emoji} ${req.method.padEnd(7)} ${req.path.substring(0, 40)} ` +
            `${statusColor}${statusCode}${reset} ` +
            `${formatDuration(durationMs)} ` +
            `${getRealIP(req)}`
          );
        }
      }

      // Log to file with full details
      logger.logHttp(req.method, req.path, statusCode, durationMs, {
        correlationId: req.correlationId,
        requestId: req.id,
        userId: req.user?.id,
        ip: getRealIP(req),
        userAgent: req.get('user-agent'),
        slow: isSlow,
      });

      // Performance logging
      if (isSlow) {
        logger.performance(`${req.method} ${req.path}`, durationMs, {
          status: statusCode,
          threshold: config.slowRequestThreshold,
        });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // Error Handler
    // ═══════════════════════════════════════════════════════════

    res.on('error', (err) => {
      logger.errorWithStack('Response Error', err, {
        method: req.method,
        url: req.url,
        requestId: req.id,
        correlationId: req.correlationId,
      });
    });

    // ═══════════════════════════════════════════════════════════
    // Next
    // ═══════════════════════════════════════════════════════════════

    next();
  };
};

// ═══════════════════════════════════════════════════════════════
// Error Handler Middleware
// ═══════════════════════════════════════════════════════════════

const errorLoggerMiddleware = (err, req, res, next) => {
  const startTime = req.startTime ? Number(process.hrtime.bigint() - req.startTime) / 1e6 : 0;
  
  // Log error with full details
  logger.errorWithStack(`❌ ${req.method} ${req.path} - ${err.message}`, err, {
    method: req.method,
    url: req.url,
    status: err.status || err.statusCode || 500,
    duration: formatDuration(startTime),
    ip: getRealIP(req),
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId,
    requestId: req.id,
    userId: req.user?.id,
    body: CONFIG.logRequestBody ? filterSensitiveData(req.body) : undefined,
    query: CONFIG.logQuery ? req.query : undefined,
  });

  // Continue to error handler
  next(err);
};

// ═══════════════════════════════════════════════════════════════
// Not Found Handler
// ═══════════════════════════════════════════════════════════════

const notFoundLoggerMiddleware = (req, res, next) => {
  logger.warn(`🔍 404 Not Found: ${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    ip: getRealIP(req),
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId,
    requestId: req.id,
  });
  
  next();
};

// ═══════════════════════════════════════════════════════════════
// Utility Middleware
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware برای تنظیم correlation ID
 */
const correlationMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || uuidv4();
  req.id = req.id || req.correlationId;
  
  // Set header in response
  res.setHeader('X-Correlation-ID', req.correlationId);
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

/**
 * Middleware برای لاگ دستی
 */
const manualLoggerMiddleware = (req, res, next) => {
  // Store original end
  const originalEnd = res.end;
  const startTime = req.startTime || process.hrtime.bigint();
  
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    
    // Log request
    logger.logRequest(req, res, durationMs);
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

// ═══════════════════════════════════════════════════════════════
// Configuration Setters
// ═══════════════════════════════════════════════════════════════

loggerMiddleware.setConfig = (newConfig) => {
  Object.assign(CONFIG, newConfig);
};

loggerMiddleware.getConfig = () => ({ ...CONFIG });

loggerMiddleware.addExcludePath = (path) => {
  CONFIG.excludePaths.push(path);
};

loggerMiddleware.addExcludePattern = (pattern) => {
  CONFIG.excludePatterns.push(new RegExp(pattern));
};

loggerMiddleware.setSlowThreshold = (threshold) => {
  CONFIG.slowRequestThreshold = threshold;
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = loggerMiddleware;
module.exports.errorLogger = errorLoggerMiddleware;
module.exports.notFoundLogger = notFoundLoggerMiddleware;
module.exports.correlationMiddleware = correlationMiddleware;
module.exports.manualLogger = manualLoggerMiddleware;