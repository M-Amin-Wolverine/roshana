// 📦 نصب پکیج‌های مورد نیاز:
// npm install winston winston-daily-rotate-file

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
//                    📁 ایجاد پوشه لاگ‌ها
// ═══════════════════════════════════════════════════════════════
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
//                    🎨 فرمت‌های سفارشی
// ═══════════════════════════════════════════════════════════════
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // اضافه کردن متادیتا
    if (Object.keys(metadata).length > 0) {
      msg += `\n📋 Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    // اضافه کردن stack trace
    if (metadata.stack) {
      msg += `\n🔴 Stack: ${metadata.stack}`;
    }
    
    return msg;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const simpleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} ${level} ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// ═══════════════════════════════════════════════════════════════
//                    🚚 Transport‌ها
// ═══════════════════════════════════════════════════════════════
const transports = {
  // فایل خطاها
  errorFile: new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }),

  // فایل ترکیبی
  combinedFile: new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10
  }),

  // فایل لاگ‌های امنیتی
  securityFile: new winston.transports.File({
    filename: path.join(logsDir, 'security.log'),
    level: 'security',
    format: jsonFormat,
    maxsize: 5 * 1024 * 1024,
    maxFiles: 10
  }),

  // فایل لاگ‌های دیتابیس
  dbFile: new winston.transports.File({
    filename: path.join(logsDir, 'database.log'),
    level: 'db',
    format: jsonFormat,
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5
  }),

  // فایل لاگ‌های HTTP
  httpFile: new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: jsonFormat,
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5
  }),

  // فایل لاگ‌های API
  apiFile: new winston.transports.File({
    filename: path.join(logsDir, 'api.log'),
    level: 'api',
    format: jsonFormat,
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5
  }),

  // کنسول (فقط در توسعه)
  console: new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' 
      ? jsonFormat 
      : simpleFormat,
    level: 'debug'
  })
};

// ═══════════════════════════════════════════════════════════════
//                    🏗️ ایجاد Logger اصلی
// ═══════════════════════════════════════════════════════════════
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: {
    error: 0,
    fatal: 1,
    warn: 2,
    help: 3,
    data: 4,
    info: 5,
    debug: 6,
    verbose: 7,
    silly: 8,
    http: 9,
    api: 10,
    db: 11,
    security: 12,
    trace: 13,
    processing: 14,
    cache: 15,
    queue: 16
  },
  format: customFormat,
  transports: [
    transports.errorFile,
    transports.combinedFile,
    transports.securityFile,
    transports.dbFile,
    transports.httpFile,
    transports.apiFile,
    transports.console
  ],
  exitOnError: false
});

// ═══════════════════════════════════════════════════════════════
//                    🔐 Logger امنیتی
// ═══════════════════════════════════════════════════════════════
const securityLogger = winston.createLogger({
  level: 'security',
  levels: logger.levels,
  format: jsonFormat,
  transports: [
    transports.securityFile,
    transports.console
  ]
});

// ═══════════════════════════════════════════════════════════════
//                    💾 Logger دیتابیس
// ═══════════════════════════════════════════════════════════════
const dbLogger = winston.createLogger({
  level: 'db',
  levels: logger.levels,
  format: jsonFormat,
  transports: [
    transports.dbFile,
    transports.console
  ]
});

// ═══════════════════════════════════════════════════════════════
//                    🌐 Logger HTTP
// ═══════════════════════════════════════════════════════════════
const httpLogger = winston.createLogger({
  level: 'http',
  levels: logger.levels,
  format: jsonFormat,
  transports: [
    transports.httpFile,
    transports.console
  ]
});

// ═══════════════════════════════════════════════════════════════
//                    📡 Logger API
// ═══════════════════════════════════════════════════════════════
const apiLogger = winston.createLogger({
  level: 'api',
  levels: logger.levels,
  format: jsonFormat,
  transports: [
    transports.apiFile,
    transports.console
  ]
});

// ═══════════════════════════════════════════════════════════════
//                    👶 ایجاد Child Logger
// ═══════════════════════════════════════════════════════════════
function createChildLogger(module, options = {}) {
  return logger.child({
    module: module,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════
//                    🔐 لاگ‌های امنیتی
// ═══════════════════════════════════════════════════════════════
function logSecurity(event, data = {}) {
  const securityData = {
    event,
    ...data,
    timestamp: new Date().toISOString(),
    ip: data.ip || 'unknown',
    userAgent: data.userAgent || 'unknown'
  };

  securityLogger.security(event, securityData);
  
  // همچنین در logger اصلی
  logger.security(`🔒 ${event}`, securityData);
}

// ═══════════════════════════════════════════════════════════════
//                    💾 لاگ‌های دیتابیس
// ═══════════════════════════════════════════════════════════════
function logDb(operation, query, duration, metadata = {}) {
  const dbData = {
    operation,
    query: query.substring(0, 500), // محدود کردن طول query
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  dbLogger.db(`${operation} on ${metadata.table || 'unknown'}`, dbData);
  logger.db(`💾 ${operation}`, dbData);
}

// ═══════════════════════════════════════════════════════════════
//                    👤 لاگ عملیات کاربر
// ═══════════════════════════════════════════════════════════════
function logUserAction(userId, action, details = {}) {
  const userData = {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  };

  logger.info(`👤 ${action}`, userData);
}

// ═══════════════════════════════════════════════════════════════
//                    🌐 Middleware لاگ درخواست‌های HTTP
// ═══════════════════════════════════════════════════════════════
function logMiddleware(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // لاگ شروع درخواست
  logger.http('📥 درخواست دریافت شد', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body ? JSON.stringify(req.body).substring(0, 200) : undefined
  });

  // پاسخ به درخواست
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const httpData = {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length')
    };

    // لاگ بر اساس وضعیت پاسخ
    if (res.statusCode >= 500) {
      logger.error(`❌ خطای سرور`, httpData);
    } else if (res.statusCode >= 400) {
      logger.warn(`⚠️ خطای کلاینت`, httpData);
    } else {
      logger.http(`📤 پاسخ ارسال شد`, httpData);
    }

    // لاگ در فایل جداگانه
    httpLogger.http(`${req.method} ${req.url}`, {
      ...httpData,
      timestamp: new Date().toISOString()
    });
  });

  next();
}

// ═══════════════════════════════════════════════════════════════
//                    🔄 Middleware لاگ API
// ═══════════════════════════════════════════════════════════════
function logApi(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const apiData = {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
      body: req.body,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip
    };

    apiLogger.api(`${req.method} ${req.path}`, {
      ...apiData,
      timestamp: new Date().toISOString()
    });
  });

  next();
}

// ═══════════════════════════════════════════════════════════════
//                    🎯 Middleware لاگ خطا
// ═══════════════════════════════════════════════════════════════
function logError(err, req, res, next) {
  const errorData = {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  };

  logger.error('❌ خطایUnhandled', errorData);
  next(err);
}

// ═══════════════════════════════════════════════════════════════
//                    📊 آمار لاگ‌ها
// ═══════════════════════════════════════════════════════════════
function getLogStats() {
  const stats = {
    levels: {},
    files: {},
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  // خواندن اطلاعات فایل‌ها
  const logFiles = fs.readdirSync(logsDir);
  logFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    stats.files[file] = {
      size: `${(stats.size / 1024).toFixed(2)} KB`,
      created: stats.birthtime,
      modified: stats.mtime
    };
  });

  return stats;
}

// ═══════════════════════════════════════════════════════════════
//                    🧹 پاکسازی لاگ‌های قدیمی
// ═══════════════════════════════════════════════════════════════
function cleanupOldLogs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  let deletedCount = 0;
  
  try {
    const logFiles = fs.readdirSync(logsDir);
    
    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      const fileStats = fs.statSync(filePath);
      
      if (fileStats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
        logger.info(`🗑️ فایل لاگ حذف شد: ${file}`);
      }
    });
    
    logger.info(`✅ پاکسازی تکمیل شد. ${deletedCount} فایل حذف شد.`);
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('❌ خطا در پاکسازی لاگ‌ها', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
//                    🎪 لاگ Event‌ها
// ═══════════════════════════════════════════════════════════════
function logEvent(event, data = {}) {
  const eventData = {
    event,
    ...data,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  };

  logger.info(`🎪 ${event}`, eventData);
}

// ═══════════════════════════════════════════════════════════════
//                    📤 خروجی ماژول
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//                    📤 خروجی ماژول
// ═══════════════════════════════════════════════════════════════

// اول logger اصلی رو به عنوان default export
const exportedLogger = logger;

// بعد همه متدهای اضافی رو بهش attach کن
exportedLogger.securityLogger = securityLogger;
exportedLogger.dbLogger = dbLogger;
exportedLogger.httpLogger = httpLogger;
exportedLogger.apiLogger = apiLogger;
exportedLogger.createChildLogger = createChildLogger;
exportedLogger.logMiddleware = logMiddleware;
exportedLogger.logApi = logApi;
exportedLogger.logError = logError;
exportedLogger.logSecurity = logSecurity;
exportedLogger.logUserAction = logUserAction;
exportedLogger.logDb = logDb;
exportedLogger.logEvent = logEvent;
exportedLogger.getLogStats = getLogStats;
exportedLogger.cleanupOldLogs = cleanupOldLogs;

module.exports = exportedLogger;