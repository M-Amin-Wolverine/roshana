// utils/logger/index.js

const os = require('os');
const uuid = require('uuid');
const EventEmitter = require('events');
const config = require('../../config');
const consoleLogger = require('./console');
const fileLogger = require('./file');
const httpLogger = require('./http');
const databaseLogger = require('./database');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // سطح لاگ پیش‌فرض
  defaultLevel: config.log?.level || 'info',
  
  // فعال/غیرفعال transporters
  transports: {
    console: config.log?.enableConsole ?? true,
    file: config.log?.enableFile ?? true,
    database: config.log?.enableDatabase ?? false,
  },
  
  // فیلترها
  filters: {
    excludePaths: config.log?.excludePaths || [],
    excludePatterns: config.log?.excludePatterns || [],
  },
  
  // بافر
  buffer: {
    enabled: config.log?.buffer?.enabled ?? true,
    size: config.log?.buffer?.size || 100,
    flushInterval: config.log?.buffer?.flushInterval || 5000,
  },
  
  // متادیتای پیش‌فرض
  defaultMeta: {
    service: config.service?.name || 'app',
    version: config.service?.version || '1.0.0',
    environment: config.env || 'development',
    hostname: os.hostname(),
    pid: process.pid,
  },
};

// ═══════════════════════════════════════════════════════════════
// Log Buffer
// ═══════════════════════════════════════════════════════════════

class LogBuffer {
  constructor(options = {}) {
    this.buffer = [];
    this.maxSize = options.size || CONFIG.buffer.size;
    this.flushInterval = options.flushInterval || CONFIG.buffer.flushInterval;
    this.enabled = options.enabled ?? CONFIG.buffer.enabled;
    this.timer = null;
    
    if (this.enabled) {
      this._startFlushing();
    }
  }

  _startFlushing() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
    
    this.timer.unref();
  }

  push(level, message, meta) {
    if (!this.enabled) return false;
    
    this.buffer.push({
      level,
      message,
      meta,
      timestamp: new Date().toISOString(),
    });
    
    // Trim if needed
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    
    return true;
  }

  flush() {
    if (this.buffer.length === 0) return;
    
    const toFlush = [...this.buffer];
    this.buffer = [];
    
    return toFlush;
  }

  clear() {
    this.buffer = [];
  }

  size() {
    return this.buffer.length;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Log Filter
// ═══════════════════════════════════════════════════════════════

class LogFilter {
  constructor() {
    this.excludePaths = new Set(CONFIG.filters.excludePaths);
    this.excludePatterns = CONFIG.filters.excludePatterns.map(p => new RegExp(p, 'i'));
    this.customFilters = [];
  }

  shouldLog(level, message, meta = {}) {
    // Check custom filters
    for (const filter of this.customFilters) {
      if (!filter(level, message, meta)) {
        return false;
      }
    }
    
    // Check path exclusions
    if (meta.path && this.excludePaths.has(meta.path)) {
      return false;
    }
    
    // Check pattern exclusions
    for (const pattern of this.excludePatterns) {
      if (pattern.test(message)) {
        return false;
      }
    }
    
    return true;
  }

  addExcludePath(path) {
    this.excludePaths.add(path);
  }

  addExcludePattern(pattern) {
    this.excludePatterns.push(new RegExp(pattern, 'i'));
  }

  addCustomFilter(fn) {
    this.customFilters.push(fn);
  }

  clearFilters() {
    this.customFilters = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// Metrics Collector
// ═══════════════════════════════════════════════════════════════

class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.timers = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  increment(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  decrement(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current - value);
  }

  gauge(name, value) {
    this.gauges.set(name, {
      value,
      timestamp: new Date().toISOString(),
    });
  }

  timing(name, duration) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    
    const values = this.histograms.get(name);
    values.push(duration);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  startTimer(name) {
    this.timers.set(name, Date.now());
  }

  stopTimer(name) {
    const start = this.timers.get(name);
    if (!start) return null;
    
    const duration = Date.now() - start;
    this.timing(name, duration);
    this.timers.delete(name);
    
    return duration;
  }

  getStats() {
    const stats = {
      uptime: Date.now() - this.startTime,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
    };
    
    // Calculate histogram stats
    for (const [name, values] of this.histograms) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      stats.histograms[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }
    
    return stats;
  }

  reset() {
    this.counters.clear();
    this.timers.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.startTime = Date.now();
  }
}

// ═══════════════════════════════════════════════════════════════
// Child Logger
// ═══════════════════════════════════════════════════════════════

class ChildLogger {
  constructor(parent, defaultMeta = {}) {
    this.parent = parent;
    this.defaultMeta = defaultMeta;
  }

  _mergeMeta(meta = {}) {
    return { ...this.defaultMeta, ...meta };
  }

  log(level, message, meta = {}) {
    this.parent.log(level, message, this._mergeMeta(meta));
  }

  error(message, meta = {}) {
    this.parent.error(message, this._mergeMeta(meta));
  }

  warn(message, meta = {}) {
    this.parent.warn(message, this._mergeMeta(meta));
  }

  info(message, meta = {}) {
    this.parent.info(message, this._mergeMeta(meta));
  }

  debug(message, meta = {}) {
    this.parent.debug(message, this._mergeMeta(meta));
  }

  http(message, meta = {}) {
    this.parent.http(message, this._mergeMeta(meta));
  }

  child(additionalMeta) {
    return new ChildLogger(this.parent, { ...this.defaultMeta, ...additionalMeta });
  }
}

// ═══════════════════════════════════════════════════════════════
// Enhanced Logger Class
// ═══════════════════════════════════════════════════════════════

class Logger extends EventEmitter {
  constructor() {
    super();
    
    // Initialize components
    this.buffer = new LogBuffer(CONFIG.buffer);
    this.filter = new LogFilter();
    this.metrics = new MetricsCollector();
    
    // Store loggers
    this.console = consoleLogger;
    this.file = fileLogger;
    this.database = databaseLogger;
    this.http = httpLogger;
    
    // State
    this.isInitialized = false;
    this.isShuttingDown = false;
    this.correlationId = null;
    
    // Initialize
    this._init();
  }

  _init() {
    // Setup buffer flushing
    this.buffer.flushInterval && setInterval(() => {
      const buffered = this.buffer.flush();
      if (buffered && buffered.length > 0) {
        buffered.forEach(({ level, message, meta }) => {
          this._write(level, message, meta);
        });
      }
    }, this.buffer.flushInterval);

    // Setup graceful shutdown
    this._setupGracefulShutdown();

    // Setup uncaught exception handler
    this._setupExceptionHandlers();

    this.isInitialized = true;
    
    // Emit ready event
    this.emit('ready');
  }

  // ─────────────────────────────────────────────────────────────
  // Core Logging Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ اصلی
   */
  log(level, message, meta = {}) {
    // Check filter
    if (!this.filter.shouldLog(level, message, meta)) {
      return;
    }

    // Add correlation ID if exists
    if (this.correlationId && !meta.correlationId) {
      meta.correlationId = this.correlationId;
    }

    // Add default metadata
    const fullMeta = {
      ...CONFIG.defaultMeta,
      ...meta,
    };

    // Buffer or write directly
    if (this.buffer.enabled && this.buffer.size() >= this.buffer.maxSize) {
      this.buffer.push(level, message, fullMeta);
    } else {
      this._write(level, message, fullMeta);
    }

    // Emit log event
    this.emit('log', { level, message, meta: fullMeta });
    
    // Increment metrics
    this.metrics.increment(`log.${level}`);
  }

  /**
   * نوشتن به تمام transporters
   */
  _write(level, message, meta = {}) {
    // Console
    if (CONFIG.transports.console) {
      try {
        this.console.log(level, message, meta);
      } catch (err) {
        console.error('Console log error:', err);
      }
    }

    // File
    if (CONFIG.transports.file) {
      try {
        this.file.log(level, message, meta);
      } catch (err) {
        console.error('File log error:', err);
      }
    }

    // Database (optional)
    if (CONFIG.transports.database && level === 'error') {
      try {
        // Could store errors in database
      } catch (err) {
        console.error('Database log error:', err);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Shortcut Methods
  // ─────────────────────────────────────────────────────────────

  error(message, meta = {}) {
    this.log('error', message, meta);
    this.metrics.increment('errors.total');
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

  verbose(message, meta = {}) {
    this.log('verbose', message, meta);
  }

  silly(message, meta = {}) {
    this.log('silly', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  // ─────────────────────────────────────────────────────────────
  // Specialized Logging Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ خطا با Stack Trace
   */
  errorWithStack(message, error, meta = {}) {
    this.error(message, {
      ...meta,
      error: {
        name: error?.name,
        message: error?.message,
        stack: config.env === 'development' ? error?.stack : undefined,
        code: error?.code,
        errno: error?.errno,
      },
    });
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

  /**
   * لاگ با تایمر
   */
  logTimed(level, message, fn) {
    const startTime = Date.now();
    const result = fn();
    const duration = Date.now() - startTime;
    
    this.log(level, message, { duration: `${duration}ms` });
    
    return result;
  }

  /**
   * لاگ async با تایمر
   */
  async logTimedAsync(level, message, fn) {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    this.log(level, message, { duration: `${duration}ms` });
    
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Application Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ شروع سرور
   */
  serverStart(port, host) {
    this.info('🚀 Server Started Successfully!', {
      port,
      host,
      environment: config.env,
      version: config.service?.version,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    });

    // Banner in development
    if (config.env === 'development') {
      this.console.banner(`Server Ready on ${host}:${port}`, 'frame');
    }
  }

  /**
   * لاگ خاموش شدن سرور
   */
  serverShutdown(signal) {
    this.isShuttingDown = true;
    
    this.info('🛑 Server Shutting Down', {
      signal,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });

    // Flush buffer
    const buffered = this.buffer.flush();
    if (buffered && buffered.length > 0) {
      buffered.forEach(({ level, message, meta }) => {
        this._write(level, message, meta);
      });
    }
  }

  /**
   * لاگ ری‌استارت
   */
  serverRestart(reason = 'manual') {
    this.warn('🔄 Server Restarting', {
      reason,
      pid: process.pid,
      uptime: process.uptime(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // User & Security Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ عملیات کاربر
   */
  userAction(userId, action, details = {}) {
    this.info(`👤 User Action: ${action}`, {
      userId,
      action,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * لاگ ورود کاربر
   */
  userLogin(userId, method, success, details = {}) {
    const level = success ? 'info' : 'warn';
    this.log(level, success ? '✅ User Login' : '❌ Login Failed', {
      userId,
      method,
      success,
      ...details,
    });
  }

  /**
   * لاگ ثبت‌نام کاربر
   */
  userRegister(userId, details = {}) {
    this.info('🆕 New User Registered', {
      userId,
      ...details,
    });
  }

  /**
   * لاگ خروج کاربر
   */
  userLogout(userId, details = {}) {
    this.info('👋 User Logged Out', {
      userId,
      ...details,
    });
  }

  /**
   * لاگ رویداد امنیتی
   */
  security(event, details = {}) {
    this.warn(`🔒 Security Event: ${event}`, {
      ...details,
      event,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * لاگ تلاش نفوذ
   */
  securityBreach(attempt, details = {}) {
    this.error(`🚨 Security Breach: ${attempt}`, {
      ...details,
      attempt,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * لاگ دسترسی غیرمجاز
   */
  unauthorizedAccess(resource, details = {}) {
    this.warn(`🚫 Unauthorized Access: ${resource}`, {
      resource,
      ...details,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Business Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ رویداد تجاری
   */
  business(event, data = {}) {
    this.info(`💼 Business Event: ${event}`, {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * لاگ سفارش
   */
  orderCreated(orderId, data = {}) {
    this.business('order_created', { orderId, ...data });
  }

  /**
   * لاگ پرداخت
   */
  paymentProcessed(paymentId, data = {}) {
    this.business('payment_processed', { paymentId, ...data });
  }

  /**
   * لاگ خطای پرداخت
   */
  paymentFailed(paymentId, error, data = {}) {
    this.error(`💳 Payment Failed: ${paymentId}`, {
      paymentId,
      error: error.message,
      ...data,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Performance Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ عملکرد
   */
  performance(operation, duration, details = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.log(level, `⚡ Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...details,
    });
    
    // Also log to file logger's performance
    this.file.performance(operation, duration, details);
  }

  /**
   * شروع تایمر
   */
  startTimer(name) {
    this.metrics.startTimer(name);
  }

  /**
   * پایان تایمر و لاگ
   */
  endTimer(name, details = {}) {
    const duration = this.metrics.stopTimer(name);
    if (duration !== null) {
      this.performance(name, duration, details);
    }
    return duration;
  }

  // ─────────────────────────────────────────────────────────────
  // HTTP Logger Integration
  // ─────────────────────────────────────────────────────────────

  /**
   * دریافت middleware HTTP
   */
  getHttpLogger() {
    return this.http.getMiddleware();
  }

  /**
   * دریافت error middleware HTTP
   */
  getHttpErrorLogger() {
    return this.http.getErrorMiddleware();
  }

  /**
   * لاگ دستی HTTP
   */
  logHttp(method, url, status, duration, details = {}) {
    this.http.log(method, url, status, duration, details);
  }

  // ─────────────────────────────────────────────────────────────
  // Database Logger Integration
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ کوئری دیتابیس
   */
  logQuery(query, duration, details = {}) {
    this.database.logQuery(query, duration, details);
  }

  /**
   * لاگ خطای دیتابیس
   */
  logDatabaseError(error, details = {}) {
    this.database.logError(error, details);
  }

  /**
   * لاگ تراکنش
   */
  beginTransaction(id, details = {}) {
    return this.database.beginTransaction(id, details);
  }

  commitTransaction(id, details = {}) {
    return this.database.commitTransaction(id, details);
  }

  rollbackTransaction(id, error) {
    return this.database.rollbackTransaction(id, error);
  }

  // ─────────────────────────────────────────────────────────────
  // Child Logger
  // ─────────────────────────────────────────────────────────────

  /**
   * ایجاد logger فرزند
   */
  child(defaultMeta) {
    return new ChildLogger(this, defaultMeta);
  }

  /**
   * ایجاد logger با correlation ID
   */
  withCorrelation(correlationId) {
    return this.child({ correlationId });
  }

  /**
   * ایجاد logger با user ID
   */
  withUser(userId) {
    return this.child({ userId });
  }

  /**
   * ایجاد logger با request ID
   */
  withRequest(requestId) {
    return this.child({ requestId });
  }

  // ─────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────

  /**
   * تغییر سطح لاگ
   */
  setLevel(level) {
    this.console.setLevel?.(level);
    this.file.setLevel?.(level);
    this.info(`Log level changed to: ${level}`);
  }

  /**
   * فعال کردن transporter
   */
  enableTransport(transport) {
    CONFIG.transports[transport] = true;
    this.info(`Transport enabled: ${transport}`);
  }

  /**
   * غیرفعال کردن transporter
   */
  disableTransport(transport) {
    CONFIG.transports[transport] = false;
    this.info(`Transport disabled: ${transport}`);
  }

  /**
   * افزودن فیلتر
   */
  addFilter(fn) {
    this.filter.addCustomFilter(fn);
  }

  /**
   * اضافه کردن مسیر مستثنی
   */
  addExcludePath(path) {
    this.filter.addExcludePath(path);
  }

  // ─────────────────────────────────────────────────────────────
  // Metrics & Stats
  // ─────────────────────────────────────────────────────────────

  /**
   * دریافت آمار
   */
  getStats() {
    return {
      logger: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        config: {
          level: CONFIG.defaultLevel,
          transports: CONFIG.transports,
        },
      },
      metrics: this.metrics.getStats(),
      buffer: {
        size: this.buffer.size(),
        maxSize: this.buffer.maxSize,
      },
      http: this.http.getStats(),
      database: this.database.getStats(),
    };
  }

  /**
   * دریافت آمار کنسول
   */
  getConsoleStats() {
    return this.console.getStats?.() || {};
  }

  /**
   * دریافت آمار فایل
   */
  async getFileStats() {
    return {
      query: await this.file.query?.() || [],
      stats: await this.file.getStats?.() || {},
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * پاک کردن بافر
   */
  flush() {
    const buffered = this.buffer.flush();
    if (buffered && buffered.length > 0) {
      buffered.forEach(({ level, message, meta }) => {
        this._write(level, message, meta);
      });
    }
    this.info('Buffer flushed');
  }

  /**
   * پاک کردن تمام لاگ‌ها
   */
  clear() {
    this.buffer.clear();
    this.metrics.reset();
    this.console.clear?.();
  }

  /**
   * تنظیم correlation ID
   */
  setCorrelationId(id) {
    this.correlationId = id;
  }

  /**
   * پاک کردن correlation ID
   */
  clearCorrelationId() {
    this.correlationId = null;
  }

  // ─────────────────────────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────────────────────────

  _setupGracefulShutdown() {
    const shutdown = (signal) => {
      return () => {
        this.serverShutdown(signal);
        this.flush();
        
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      };
    };

    process.on('SIGTERM', shutdown('SIGTERM'));
    process.on('SIGINT', shutdown('SIGINT'));
  }

  _setupExceptionHandlers() {
    process.on('uncaughtException', (error) => {
      this.errorWithStack('Uncaught Exception', error, {
        fatal: true,
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: config.env === 'development' ? reason?.stack : undefined,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Health Check
  // ─────────────────────────────────────────────────────────────

  /**
   * بررسی سلامت logger
   */
  healthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      bufferSize: this.buffer.size(),
      transports: {
        console: CONFIG.transports.console,
        file: CONFIG.transports.file,
        database: CONFIG.transports.database,
      },
      lastLog: this.buffer.size() > 0 
        ? this.buffer.buffer[this.buffer.buffer.length - 1]?.message 
        : null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Express/Request Integration
  // ─────────────────────────────────────────────────────────────

  /**
   * ایجاد middleware برای Express
   */
  expressMiddleware() {
    return (req, res, next) => {
      // Set correlation ID
      req.id = req.id || uuid.v4();
      req.correlationId = req.get('x-correlation-id') || req.id;
      
      // Set in logger
      this.setCorrelationId(req.correlationId);
      
      // Add to request
      req.logger = this.child({
        correlationId: req.correlationId,
        userId: req.user?.id,
        requestId: req.id,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      // Response finish handler
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
        
        this.logHttp(req.method, req.path, res.statusCode, duration, {
          correlationId: req.correlationId,
          userId: req.user?.id,
          ip: req.ip,
        });
        
        this.clearCorrelationId();
      });
      
      next();
    };
  }

  /**
   * لاگ دستی درخواست
   */
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      correlationId: req.correlationId,
    };
    
    if (res.statusCode >= 500) {
      this.error(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, meta);
    } else if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, meta);
    } else {
      this.http(`${req.method} ${req.url}`, meta);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = new Logger();
// ===== LEVEL 2 BA'ASS PATCH =====

const { pushLog } = require("./queue");
const { encryptLog } = require("./encryption");

function log(level, data) {
  const payload = {
    level,
    data,
    timestamp: new Date().toISOString()
  };

  pushLog(payload);

  const secure = encryptLog(payload);

  console.log("[LOG]", secure);
}

module.exports = { log };
