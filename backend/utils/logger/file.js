// utils/logger/file.js

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs').promises;
const { existsSync, mkdirSync } = require('fs');
const config = require('../../config');
const { combine, timestamp, printf, json, colorize, label } = winston.format;

// ═══════════════════════════════════════════════════════════════
// Custom Formatters
// ═══════════════════════════════════════════════════════════════

/**
 * فرمت JSON با متادیتای سفارشی
 */
const jsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  label({ label: config.service?.name || 'APP' }),
  json({
    replacer: (key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
          ...value
        };
      }
      return value;
    }
  })
);

/**
 * فرمت خوانا برای انسان
 */
const plainFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize({ all: false }),
  printf(({ timestamp, level, message, label: svcLabel, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 && meta.metadata
      ? `\n  📦 Data: ${JSON.stringify(meta.metadata, null, 2)}`
      : '';
    const stack = meta.stack ? `\n  🔴 Stack: ${meta.stack}` : '';
    return `${timestamp} [${level.toUpperCase()}] [${svcLabel}] ${message}${metaStr}${stack}`;
  })
);

/**
 * فرمت کامپکت (کم حجم)
 */
const compactFormat = combine(
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`;
  })
);

/**
 * فرمت CSV برای تحلیل
 */
const csvFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metadata = meta.metadata ? JSON.stringify(meta.metadata).replace(/"/g, '""') : '';
    return `"${timestamp}","${level}","${message.replace(/"/g, '""')}","${metadata}"`;
  })
);

// ═══════════════════════════════════════════════════════════════
// Transport Factory
// ═══════════════════════════════════════════════════════════════

class TransportFactory {
  static createRotateTransport(options) {
    const {
      filename,
      level = 'info',
      format = jsonFormat,
      maxFiles = 30,
      maxSize = '20m',
      zippedArchive = true,
      auditFile = true
    } = options;

    // اطمینان از وجود دایرکتوری
    const dir = path.dirname(filename);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return new DailyRotateFile({
      filename,
      datePattern: 'YYYY-MM-DD',
      zippedArchive,
      maxSize,
      maxFiles,
      auditFile,
      level,
      format,
      handleExceptions: true,
      handleRejections: true,
    });
  }

  static createMemoryTransport(options) {
    const { maxSize = 1000 } = options;
    
    return new winston.transports.Memory({
      level: 'debug',
      maxsize: maxSize,
    });
  }

  static createStreamTransport(options) {
    const { stream, level = 'info', format = jsonFormat } = options;
    
    return new winston.transports.Stream({
      stream,
      level,
      format,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Enhanced File Logger Class
// ═══════════════════════════════════════════════════════════════

class FileLogger {
  constructor() {
    this.logger = null;
    this.transports = [];
    this.queryCache = new Map();
    this.queryCacheTimeout = 60000; // 1 minute
    this.buffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000;
    this.isInitialized = false;
    
    this.init();
  }

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────

  init() {
    if (!config.log?.enableFile) {
      console.warn('File logging is disabled in config');
      return;
    }

    const logDir = config.log.dir || './logs';
    const maxFiles = config.log.maxFiles || 30;
    const maxSize = config.log.maxSize || '20m';
    const serviceName = config.service?.name || 'app';

    // ═══════════════════════════════════════════════════════════
    // Transport Definitions
    // ═══════════════════════════════════════════════════════════

    // 1. لاگ عمومی (همه سطح‌ها)
    const commonTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'app', `${serviceName}-%DATE%.log`),
      level: 'info',
      format: jsonFormat,
      maxFiles,
      maxSize,
    });

    // 2. لاگ خطاها (فقط error و بالاتر)
    const errorTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'error', `error-%DATE%.log`),
      level: 'error',
      format: jsonFormat,
      maxFiles: maxFiles * 2, // خطاها بیشتر نگه‌داری بشن
      maxSize,
    });

    // 3. لاگ درخواست‌های HTTP
    const httpTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'http', `http-%DATE%.log`),
      level: 'http',
      format: plainFormat,
      maxFiles: Math.ceil(maxFiles / 2),
      maxSize: '50m', // HTTP logs can be larger
    });

    // 4. لاگ ترکیبی (خوانا برای انسان)
    const combinedTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'combined', `combined-%DATE%.log`),
      level: 'debug',
      format: plainFormat,
      maxFiles,
      maxSize,
    });

    // 5. لاگ دیباگ (فقط در محیط توسعه)
    const debugTransport = config.env === 'development' 
      ? TransportFactory.createRotateTransport({
          filename: path.join(logDir, 'debug', `debug-%DATE%.log`),
          level: 'silly',
          format: plainFormat,
          maxFiles: 7,
          maxSize: '10m',
        })
      : null;

    // 6. لاگ عملیات حساس (امنیتی)
    const securityTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'security', `security-%DATE%.log`),
      level: 'info',
      format: jsonFormat,
      maxFiles: maxFiles * 3, // بیشتر نگه‌داری بشه
      maxSize: '10m',
    });

    // 7. لاگ عملکرد (Performance)
    const performanceTransport = TransportFactory.createRotateTransport({
      filename: path.join(logDir, 'performance', `perf-%DATE%.log`),
      level: 'info',
      format: jsonFormat,
      maxFiles: 14,
      maxSize: '10m',
    });

    // 8. لاگ در حافظه (برای دسترسی سریع)
    const memoryTransport = TransportFactory.createMemoryTransport({
      maxSize: 5000,
    });

    // ═══════════════════════════════════════════════════════════
    // Collect Transports
    // ═══════════════════════════════════════════════════════════

    this.transports = [
      commonTransport,
      errorTransport,
      httpTransport,
      combinedTransport,
      securityTransport,
      performanceTransport,
      memoryTransport,
    ].filter(Boolean);

    // ═══════════════════════════════════════════════════════════
    // Create Winston Logger
    // ═══════════════════════════════════════════════════════════

    this.logger = winston.createLogger({
      level: config.log?.level || 'info',
      levels: {
        silly: 0,
        debug: 1,
        verbose: 2,
        info: 3,
        http: 4,
        warn: 5,
        error: 6,
        critical: 7,
      },
      transports: this.transports,
      exitOnError: false,
      silent: config.env === 'test',
      
      // Exception Handling
      exceptionHandlers: [
        TransportFactory.createRotateTransport({
          filename: path.join(logDir, 'exceptions', `exception-%DATE%.log`),
          format: jsonFormat,
          maxFiles: 30,
        })
      ],
      
      // Rejection Handling
      rejectionHandlers: [
        TransportFactory.createRotateTransport({
          filename: path.join(logDir, 'rejections', `rejection-%DATE%.log`),
          format: jsonFormat,
          maxFiles: 30,
        })
      ],
    });

    // ═══════════════════════════════════════════════════════════
    // Custom Log Methods
    // ═══════════════════════════════════════════════════════════

    this._addCustomMethods();
    this.isInitialized = true;
    
    // Start buffer flush interval
    this._startBufferFlush();
  }

  // ─────────────────────────────────────────────────────────────
  // Custom Methods
  // ─────────────────────────────────────────────────────────────

  _addCustomMethods() {
    // لاگ امنیتی
    this.logger.security = (message, meta = {}) => {
      this.logger.info(`🔒 SECURITY: ${message}`, { 
        metadata: { ...meta, securityEvent: true } 
      });
    };

    // لاگ عملکرد
    this.logger.performance = (operation, duration, meta = {}) => {
      this.logger.info(`⚡ PERFORMANCE: ${operation}`, {
        metadata: { 
          ...meta, 
          operation, 
          duration: `${duration}ms`,
          performanceEvent: true 
        }
      });
    };

    // لاگ تجاری (Business)
    this.logger.business = (action, data = {}) => {
      this.logger.info(`💼 BUSINESS: ${action}`, {
        metadata: { ...data, businessEvent: true }
      });
    };

    // لاگ API
    this.logger.api = (method, endpoint, statusCode, duration, meta = {}) => {
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
      this.logger.log(level, `${method} ${endpoint}`, {
        metadata: {
          ...meta,
          method,
          endpoint,
          statusCode,
          duration: `${duration}ms`,
          apiEvent: true
        }
      });
    };

    // لاگ دیتابیس
    this.logger.database = (query, duration, meta = {}) => {
      this.logger.debug(`🗄️ DB: ${query}`, {
        metadata: {
          ...meta,
          query,
          duration: `${duration}ms`,
          databaseEvent: true
        }
      });
    };

    // لاگ با correlation ID
    this.logger.withCorrelation = (correlationId, level, message, meta = {}) => {
      this.logger.log(level, message, {
        metadata: { ...meta, correlationId }
      });
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Buffer Management
  // ─────────────────────────────────────────────────────────────

  _startBufferFlush() {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.buffer.forEach(entry => {
          this.logger.log(entry.level, entry.message, entry.meta);
        });
        this.buffer = [];
      }
    }, this.flushInterval);
  }

  _bufferLog(level, message, meta) {
    this.buffer.push({ level, message, meta });
    if (this.buffer.length >= this.bufferSize) {
      this.buffer.shift();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Public Logging Methods
  // ─────────────────────────────────────────────────────────────

  log(level, message, meta = {}) {
    if (!this.isInitialized) return;
    
    // Buffer in high-load scenarios
    if (this.buffer.length > this.bufferSize) {
      this._bufferLog(level, message, meta);
      return;
    }
    
    this.logger.log(level, message, { metadata: meta });
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  silly(message, meta = {}) {
    this.log('silly', message, meta);
  }

  // ─────────────────────────────────────────────────────────────
  // Advanced Features
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ خطا با Stack Trace کامل
   */
  errorWithStack(message, error, meta = {}) {
    this.log('error', message, {
      ...meta,
      stack: error?.stack,
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
      }
    });
  }

  /**
   * لاگ با Context
   */
  withContext(context, level, message, meta = {}) {
    this.log(level, message, { ...meta, context });
  }

  /**
   * لاگ با User ID
   */
  withUser(userId, level, message, meta = {}) {
    this.log(level, message, { ...meta, userId });
  }

  /**
   * لاگ با Request ID
   */
  withRequestId(requestId, level, message, meta = {}) {
    this.log(level, message, { ...meta, requestId });
  }

  /**
   * لاگ چندگانه
   */
  logMultiple(entries) {
    entries.forEach(({ level, message, meta }) => {
      this.log(level, message, meta);
    });
  }

  /**
   * لاگ شرطی
   */
  logIf(condition, level, message, meta = {}) {
    if (condition) {
      this.log(level, message, meta);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Query & Search
  // ─────────────────────────────────────────────────────────────

  /**
   * جستجو در لاگ‌ها
   */
  async query(options = {}) {
    const {
      level,
      start,
      end,
      limit = 100,
      order = 'desc',
      fields = null
    } = options;

    // Find the memory transport
    const memoryTransport = this.transports.find(
      t => t instanceof winston.transports.Memory
    );

    if (!memoryTransport) {
      throw new Error('Memory transport not found');
    }

    let logs = memoryTransport.buffer || [];

    // Filter by level
    if (level) {
      const levels = {
        silly: 0, debug: 1, verbose: 2, info: 3,
        http: 4, warn: 5, error: 6, critical: 7
      };
      const minLevel = levels[level] || 0;
      logs = logs.filter(l => levels[l.level] >= minLevel);
    }

    // Filter by date
    if (start) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(start));
    }
    if (end) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(end));
    }

    // Sort
    logs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Limit
    return logs.slice(0, limit);
  }

  /**
   * جستجوی متن در لاگ‌ها
   */
  async search(query, options = {}) {
    const logs = await this.query(options);
    const regex = new RegExp(query, 'i');
    return logs.filter(log => 
      regex.test(log.message) || 
      regex.test(JSON.stringify(log.metadata))
    );
  }

  /**
   * دریافت لاگ‌های خطا
   */
  async getErrors(options = {}) {
    return this.query({ level: 'error', ...options });
  }

  /**
   * دریافت آمار لاگ‌ها
   */
  async getStats(hours = 24) {
    const start = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await this.query({ start, limit: 10000 });

    const stats = {
      total: logs.length,
      byLevel: {},
      byHour: {},
    };

    logs.forEach(log => {
      // By level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // By hour
      const hour = new Date(log.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    return stats;
  }

  // ─────────────────────────────────────────────────────────────
  // File Operations
  // ─────────────────────────────────────────────────────────────

  /**
   * خواندن لاگ‌های امروز
   */
  async readTodayLog(type = 'combined') {
    const logDir = config.log?.dir || './logs';
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(logDir, type, `${type}-${today}.log`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * حذف لاگ‌های قدیمی
   */
  async cleanOldLogs(daysToKeep = 30) {
    const logDir = config.log?.dir || './logs';
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const categories = ['app', 'error', 'http', 'combined', 'security', 'performance'];
    
    for (const category of categories) {
      const categoryPath = path.join(logDir, category);
      if (!existsSync(categoryPath)) continue;

      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          const filePath = path.join(categoryPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            this.info(`Deleted old log: ${file}`);
          }
        }
      } catch (error) {
        this.error(`Error cleaning logs in ${category}`, { error: error.message });
      }
    }
  }

  /**
   * فشرده‌سازی دستی لاگ‌ها
   */
  async compressLogs() {
    const logDir = config.log?.dir || './logs';
    // Implementation depends on your compression needs
    this.info('Log compression triggered');
  }

  // ─────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────

  /**
   * تغییر سطح لاگ در runtime
   */
  setLevel(level) {
    this.transports.forEach(transport => {
      transport.level = level;
    });
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }

  /**
   * غیرفعال کردن لاگ فایل
   */
  disable() {
    this.transports.forEach(transport => {
      transport.silent = true;
    });
  }

  /**
   * فعال کردن لاگ فایل
   */
  enable() {
    this.transports.forEach(transport => {
      transport.silent = false;
    });
  }

  /**
   * اضافه کردن transport جدید
   */
  addTransport(transport) {
    this.logger.add(transport);
    this.transports.push(transport);
  }

  /**
   * حذف transport
   */
  removeTransport(transportName) {
    const transport = this.transports.find(t => t.name === transportName);
    if (transport) {
      this.logger.remove(transport);
      this.transports = this.transports.filter(t => t !== transport);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Child Loggers
  // ─────────────────────────────────────────────────────────────

  /**
   * ایجاد logger فرزند با metadata ثابت
   */
  child(defaultMeta) {
    return {
      error: (message, meta = {}) => this.log('error', message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.log('warn', message, { ...defaultMeta, ...meta }),
      info: (message, meta = {}) => this.log('info', message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.log('debug', message, { ...defaultMeta, ...meta }),
      http: (message, meta = {}) => this.log('http', message, { ...defaultMeta, ...meta }),
      child: (additionalMeta) => this.child({ ...defaultMeta, ...additionalMeta }),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Stream Interface (for Express/etc)
  // ─────────────────────────────────────────────────────────────

  getStream() {
    return {
      write: (message) => {
        const parsed = JSON.parse(message);
        this.log('http', parsed.message || 'HTTP Request', parsed);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Get Raw Winston Logger
  // ─────────────────────────────────────────────────────────────

  getLogger() {
    return this.logger;
  }
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = new FileLogger();