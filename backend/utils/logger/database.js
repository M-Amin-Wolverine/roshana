// utils/logger/database.js

const os = require('os');
const uuid = require('uuid');
const util = require('util');
const config = require('../../config');
const consoleLogger = require('./console');
const fileLogger = require('./file');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // آستانه کوئری آهسته (ms)
  slowQueryThreshold: config.log?.database?.slowThreshold || 1000,
  
  // آستانه کوئری خیلی آهسته (ms)
  verySlowQueryThreshold: config.log?.database?.verySlowThreshold || 5000,
  
  // حداکثر تعداد کوئری در حافظه
  maxQueries: config.log?.database?.maxQueries || 5000,
  
  // حداکثر طول کوئری برای لاگ
  maxQueryLength: config.log?.database?.maxQueryLength || 5000,
  
  // لاگ کردن پارامترها
  logParams: config.log?.database?.logParams ?? true,
  
  // لاگ کردن نتیجه کوئری
  logResult: config.log?.database?.logResult ?? false,
  
  // فیلدهای حساس برای فیلتر کردن
  sensitiveFields: ['password', 'token', 'secret', 'api_key', 'apikey', 'credit_card'],
  
  // نوع دیتابیس‌های پشتیبانی شده
  supportedDatabases: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'mssql'],
  
  // عملیات‌های مهم برای لاگ ویژه
  criticalOperations: ['DROP', 'TRUNCATE', 'DELETE', 'ALTER', 'DROP TABLE', 'DROP DATABASE'],
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
 * فرمت کردن مدت زمان
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * تشخیص نوع کوئری
 */
function detectQueryType(query) {
  const q = query.trim().toUpperCase();
  
  if (q.startsWith('SELECT')) return 'SELECT';
  if (q.startsWith('INSERT')) return 'INSERT';
  if (q.startsWith('UPDATE')) return 'UPDATE';
  if (q.startsWith('DELETE')) return 'DELETE';
  if (q.startsWith('CREATE')) return 'CREATE';
  if (q.startsWith('DROP')) return 'DROP';
  if (q.startsWith('ALTER')) return 'ALTER';
  if (q.startsWith('TRUNCATE')) return 'TRUNCATE';
  if (q.startsWith('BEGIN') || q.startsWith('START')) return 'TRANSACTION';
  if (q.startsWith('COMMIT')) return 'COMMIT';
  if (q.startsWith('ROLLBACK')) return 'ROLLBACK';
  if (q.startsWith('GRANT') || q.startsWith('REVOKE')) return 'PERMISSION';
  if (q.startsWith('EXPLAIN') || q.startsWith('ANALYZE')) return 'ANALYSIS';
  
  return 'OTHER';
}

/**
 * تشخیص جدول‌های استفاده شده
 */
function extractTables(query) {
  const tablePattern = /(?:FROM|JOIN|INTO|UPDATE)\s+`?(\w+)`?/gi;
  const tables = [];
  let match;
  
  while ((match = tablePattern.exec(query)) !== null) {
    tables.push(match[1]);
  }
  
  return [...new Set(tables)];
}

/**
 * بررسی عملیات بحرانی
 */
function isCriticalOperation(query) {
  return CONFIG.criticalOperations.some(op => 
    query.toUpperCase().includes(op)
  );
}

/**
 * تجزیه و تحلیل کوئری
 */
function analyzeQuery(query) {
  const type = detectQueryType(query);
  const tables = extractTables(query);
  const isSelect = type === 'SELECT';
  const hasJoin = query.toUpperCase().includes('JOIN');
  const hasSubquery = query.toUpperCase().includes('SELECT') && query.match(/\(.*SELECT.*\)/i);
  const hasGroupBy = query.toUpperCase().includes('GROUP BY');
  const hasOrderBy = query.toUpperCase().includes('ORDER BY');
  const hasLimit = query.toUpperCase().includes('LIMIT');
  const hasWhere = query.toUpperCase().includes('WHERE');
  
  return {
    type,
    tables,
    isSelect,
    hasJoin,
    hasSubquery,
    hasGroupBy,
    hasOrderBy,
    hasLimit,
    hasWhere,
    isCritical: isCriticalOperation(query),
  };
}

/**
 * پیشنهاد بهینه‌سازی
 */
function getOptimizationSuggestions(analysis, duration) {
  const suggestions = [];
  
  if (duration > CONFIG.slowQueryThreshold) {
    if (!analysis.hasLimit && analysis.isSelect) {
      suggestions.push('🔍 Add LIMIT clause to restrict result set');
    }
    if (analysis.hasJoin && !analysis.hasWhere) {
      suggestions.push('🔍 Add WHERE clause to JOIN conditions');
    }
    if (analysis.hasSubquery) {
      suggestions.push('💡 Consider using JOIN instead of subquery');
    }
    if (analysis.hasGroupBy && !analysis.hasWhere) {
      suggestions.push('💡 Consider adding WHERE before GROUP BY');
    }
    if (analysis.hasOrderBy && !analysis.hasLimit && analysis.isSelect) {
      suggestions.push('💡 Add LIMIT to avoid full sort');
    }
  }
  
  if (analysis.tables.length > 3) {
    suggestions.push('⚠️ Query involves multiple tables - consider denormalization');
  }
  
  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// Query History Manager
// ═══════════════════════════════════════════════════════════════

class QueryHistory {
  constructor(maxSize = 5000) {
    this.queries = [];
    this.maxSize = maxSize;
    this.indexes = {
      byType: {},
      byTable: {},
      byDuration: [],
      slowQueries: [],
    };
  }

  add(queryData) {
    const id = uuid.v4();
    const entry = { id, ...queryData, timestamp: new Date().toISOString() };
    
    this.queries.push(entry);
    
    // Update indexes
    this._updateIndexes(entry);
    
    // Trim if needed
    if (this.queries.length > this.maxSize) {
      this.queries.shift();
    }
    
    return id;
  }

  _updateIndexes(entry) {
    // By type
    const type = entry.analysis?.type || 'OTHER';
    if (!this.indexes.byType[type]) {
      this.indexes.byType[type] = [];
    }
    this.indexes.byType[type].push(entry.id);
    
    // By table
    if (entry.analysis?.tables) {
      entry.analysis.tables.forEach(table => {
        if (!this.indexes.byTable[table]) {
          this.indexes.byTable[table] = [];
        }
        this.indexes.byTable[table].push(entry.id);
      });
    }
    
    // By duration
    if (entry.slow || entry.duration > CONFIG.slowQueryThreshold) {
      this.indexes.slowQueries.push(entry.id);
    }
  }

  search(query, options = {}) {
    const { type, table, limit = 100, slowOnly = false } = options;
    
    let results = this.queries;
    
    // Filter by type
    if (type) {
      results = results.filter(q => q.analysis?.type === type);
    }
    
    // Filter by table
    if (table) {
      results = results.filter(q => q.analysis?.tables?.includes(table));
    }
    
    // Filter slow only
    if (slowOnly) {
      results = results.filter(q => q.slow);
    }
    
    // Search in query text
    if (query) {
      const regex = new RegExp(query, 'i');
      results = results.filter(q => regex.test(q.query));
    }
    
    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return results.slice(0, limit);
  }

  getById(id) {
    return this.queries.find(q => q.id === id);
  }

  getStats() {
    const total = this.queries.length;
    const slowCount = this.queries.filter(q => q.slow).length;
    const verySlowCount = this.queries.filter(q => q.duration > CONFIG.verySlowQueryThreshold).length;
    
    const byType = {};
    this.queries.forEach(q => {
      const type = q.analysis?.type || 'OTHER';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    const byTable = {};
    this.queries.forEach(q => {
      if (q.analysis?.tables) {
        q.analysis.tables.forEach(table => {
          byTable[table] = (byTable[table] || 0) + 1;
        });
      }
    });
    
    const avgDuration = total > 0 
      ? this.queries.reduce((acc, q) => acc + q.duration, 0) / total 
      : 0;
    
    const p95Duration = this.queries.length > 0
      ? this.queries.sort((a, b) => a.duration - b.duration)[Math.floor(total * 0.95)]?.duration || 0
      : 0;
    
    return {
      total,
      slowCount,
      verySlowCount,
      avgDuration: formatDuration(avgDuration),
      p95Duration: formatDuration(p95Duration),
      byType,
      byTable,
    };
  }

  clear() {
    this.queries = [];
    this.indexes = {
      byType: {},
      byTable: {},
      byDuration: [],
      slowQueries: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Connection Pool Manager
// ═══════════════════════════════════════════════════════════════

class ConnectionPoolManager {
  constructor() {
    this.pools = new Map();
  }

  registerPool(name, poolInfo) {
    this.pools.set(name, {
      name,
      ...poolInfo,
      createdAt: new Date().toISOString(),
      queries: 0,
      errors: 0,
      totalDuration: 0,
    });
  }

  recordQuery(poolName, duration, success = true) {
    const pool = this.pools.get(poolName);
    if (pool) {
      pool.queries++;
      pool.totalDuration += duration;
      if (!success) pool.errors++;
    }
  }

  getPoolStats(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) return null;
    
    return {
      ...pool,
      avgQueryTime: pool.queries > 0 
        ? formatDuration(pool.totalDuration / pool.queries) 
        : '0ms',
      errorRate: pool.queries > 0 
        ? `${((pool.errors / pool.queries) * 100).toFixed(2)}%` 
        : '0%',
    };
  }

  getAllPoolsStats() {
    return Array.from(this.pools.values()).map(pool => this.getPoolStats(pool.name));
  }
}

// ═══════════════════════════════════════════════════════════════
// Enhanced Database Logger Class
// ═══════════════════════════════════════════════════════════════

class DatabaseLogger {
  constructor() {
    this.history = new QueryHistory(CONFIG.maxQueries);
    this.poolManager = new ConnectionPoolManager();
    this.activeTransactions = new Map();
    this.queryCount = 0;
    this.startTime = Date.now();
    
    // Initialize
    this._init();
  }

  _init() {
    // Register default pools based on config
    if (config.database) {
      const dbType = config.database.client || config.database.type || 'default';
      this.poolManager.registerPool(dbType, {
        type: dbType,
        host: config.database.host || 'localhost',
        database: config.database.database || config.database.db || 'default',
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Query Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ کوئری اصلی
   */
  logQuery(query, duration, options = {}) {
    const {
      params = {},
      result = null,
      pool = 'default',
      database = null,
      userId = null,
      requestId = null,
    } = options;

    // Truncate query if too long
    const truncatedQuery = query.length > CONFIG.maxQueryLength
      ? query.substring(0, CONFIG.maxQueryLength) + '...'
      : query;

    // Analyze query
    const analysis = analyzeQuery(truncatedQuery);
    
    // Determine if slow
    const isVerySlow = duration > CONFIG.verySlowQueryThreshold;
    const isSlow = duration > CONFIG.slowQueryThreshold;
    
    // Filter sensitive params
    const safeParams = CONFIG.logParams ? filterSensitiveData(params) : undefined;
    const safeResult = CONFIG.logResult ? filterSensitiveData(result) : undefined;
    
    // Create query data
    const queryData = {
      query: truncatedQuery,
      rawQuery: query,
      duration,
      params: safeParams,
      result: safeResult,
      pool,
      database,
      userId,
      requestId,
      analysis,
      slow: isSlow,
      verySlow: isVerySlow,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    const queryId = this.history.add(queryData);
    queryData.id = queryId;

    // Record in pool manager
    this.poolManager.recordQuery(pool, duration, !isSlow);

    // Increment counter
    this.queryCount++;

    // Log based on severity
    if (isVerySlow) {
      this._logVerySlowQuery(queryData);
    } else if (isSlow) {
      this._logSlowQuery(queryData);
    }

    // Log critical operations
    if (analysis.isCritical) {
      this._logCriticalOperation(queryData);
    }

    // Console log in development
    if (config.env === 'development') {
      this._logToConsole(queryData);
    }

    // File log
    this._logToFile(queryData);

    return queryId;
  }

  /**
   * لاگ کوئری آهسته
   */
  _logSlowQuery(queryData) {
    const { duration, query, analysis } = queryData;
    const suggestions = getOptimizationSuggestions(analysis, duration);
    
    consoleLogger.warn(
      `🐢 Slow Query (${formatDuration(duration)})`,
      {
        type: analysis.type,
        tables: analysis.tables.join(', '),
        query: query.substring(0, 200),
        suggestions,
      }
    );
    
    // File log with full details
    fileLogger.performance('slow-query', duration, {
      query: query.substring(0, 1000),
      type: analysis.type,
      tables: analysis.tables,
      analysis,
      suggestions,
    });
  }

  /**
   * لاگ کوئری خیلی آهسته
   */
  _logVerySlowQuery(queryData) {
    const { duration, query, analysis } = queryData;
    
    consoleLogger.error(
      `💥 Very Slow Query (${formatDuration(duration)})`,
      {
        type: analysis.type,
        tables: analysis.tables,
        query: query.substring(0, 500),
      }
    );
    
    fileLogger.error(`Very Slow Query: ${query.substring(0, 500)}`, {
      duration: formatDuration(duration),
      type: analysis.type,
      tables: analysis.tables,
      analysis,
    });
  }

  /**
   * لاگ عملیات بحرانی
   */
  _logCriticalOperation(queryData) {
    const { query, analysis, userId } = queryData;
    
    consoleLogger.error(
      `⚠️ Critical Database Operation`,
      {
        operation: analysis.type,
        query: query.substring(0, 200),
        userId,
      }
    );
    
    fileLogger.security(`Critical DB Operation: ${analysis.type}`, {
      operation: analysis.type,
      query: query.substring(0, 500),
      tables: analysis.tables,
      userId,
    });
  }

  /**
   * لاگ در کنسول
   */
  _logToConsole(queryData) {
    const { duration, query, analysis, slow, verySlow } = queryData;
    
    // Emoji based on query type
    const typeEmojis = {
      SELECT: '🔍',
      INSERT: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      CREATE: '🆕',
      DROP: '💣',
      ALTER: '🔧',
      TRANSACTION: '🔄',
      COMMIT: '✅',
      ROLLBACK: '↩️',
    };
    
    const emoji = typeEmojis[analysis.type] || '📊';
    const slowIndicator = verySlow ? '💥' : slow ? '🐢' : '';
    
    consoleLogger.debug(
      `${emoji} ${analysis.type} ${slowIndicator}`,
      {
        tables: analysis.tables.join(', ') || '-',
        duration: formatDuration(duration),
        query: query.substring(0, 100),
      }
    );
  }

  /**
   * لاگ در فایل
   */
  _logToFile(queryData) {
    const { duration, query, analysis, slow, params, pool } = queryData;
    
    const level = slow ? 'warn' : 'debug';
    
    fileLogger.log(level, `DB ${analysis.type}: ${query.substring(0, 100)}`, {
      duration: formatDuration(duration),
      type: analysis.type,
      tables: analysis.tables,
      pool,
      params: params ? Object.keys(params) : undefined, // Only log param keys, not values
      slow,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Transaction Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * شروع تراکنش
   */
  beginTransaction(transactionId = uuid.v4(), options = {}) {
    this.activeTransactions.set(transactionId, {
      id: transactionId,
      startTime: Date.now(),
      queries: [],
      ...options,
    });
    
    consoleLogger.debug(`🔄 Transaction started`, { transactionId });
    
    return transactionId;
  }

  /**
   * لاگ کوئری در تراکنش
   */
  logTransactionQuery(transactionId, query, duration, options = {}) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (transaction) {
      transaction.queries.push({
        query,
        duration,
        timestamp: new Date().toISOString(),
        ...options,
      });
    }
  }

  /**
   * پایان تراکنش
   */
  commitTransaction(transactionId, options = {}) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      consoleLogger.warn(`Transaction not found: ${transactionId}`);
      return null;
    }
    
    const duration = Date.now() - transaction.startTime;
    
    const result = {
      transactionId,
      duration,
      queryCount: transaction.queries.length,
      totalDuration: transaction.queries.reduce((acc, q) => acc + q.duration, 0),
      ...options,
    };
    
    consoleLogger.debug(
      `✅ Transaction committed (${transaction.queries.length} queries, ${formatDuration(duration)})`,
      { transactionId }
    );
    
    fileLogger.log('info', `Transaction committed: ${transactionId}`, {
      ...result,
      queries: transaction.queries.map(q => q.query.substring(0, 100)),
    });
    
    this.activeTransactions.delete(transactionId);
    
    return result;
  }

  /**
   * برگشت تراکنش
   */
  rollbackTransaction(transactionId, error = null) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      consoleLogger.warn(`Transaction not found: ${transactionId}`);
      return null;
    }
    
    const duration = Date.now() - transaction.startTime;
    
    consoleLogger.error(
      `↩️ Transaction rolled back (${transaction.queries.length} queries, ${formatDuration(duration)})`,
      { transactionId, error: error?.message }
    );
    
    fileLogger.error(`Transaction rolled back: ${transactionId}`, {
      duration,
      queryCount: transaction.queries.length,
      error: error?.message,
      queries: transaction.queries.map(q => q.query.substring(0, 100)),
    });
    
    this.activeTransactions.delete(transactionId);
    
    return {
      transactionId,
      duration,
      queryCount: transaction.queries.length,
      error: error?.message,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Error Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ خطای دیتابیس
   */
  logError(error, options = {}) {
    const {
      operation = 'query',
      query = null,
      params = null,
      pool = 'default',
      database = null,
      userId = null,
      requestId = null,
    } = options;

    const errorData = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState || error.sqlstate,
      stack: config.env === 'development' ? error.stack : undefined,
      operation,
      query: query ? query.substring(0, 500) : undefined,
      params: params ? filterSensitiveData(params) : undefined,
      pool,
      database,
      userId,
      requestId,
      timestamp: new Date().toISOString(),
    };

    consoleLogger.error(
      `❌ Database Error in ${operation}`,
      {
        code: error.code,
        message: error.message,
        query: query?.substring(0, 100),
      }
    );

    fileLogger.errorWithStack(`Database Error: ${operation}`, error, {
      ...errorData,
      stack: undefined, // Already in errorData
    });

    return errorData;
  }

  // ─────────────────────────────────────────────────────────────
  // Connection Pool Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * ثبت pool جدید
   */
  registerPool(name, poolInfo) {
    this.poolManager.registerPool(name, poolInfo);
    consoleLogger.info(`📊 Database pool registered: ${name}`, poolInfo);
  }

  /**
   * لاگ رویداد pool
   */
  logPoolEvent(poolName, event, details = {}) {
    const events = {
      connect: '🔌 Connected',
      disconnect: '🔌 Disconnected',
      acquire: '✅ Acquired',
      release: '↩️ Released',
      error: '❌ Error',
    };

    const emoji = events[event] || '📊';
    consoleLogger.debug(`${emoji} Pool ${poolName}`, details);

    fileLogger.log(event === 'error' ? 'error' : 'debug', 
      `Pool ${event}: ${poolName}`, 
      details
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Batch Operations
  // ─────────────────────────────────────────────────────────────

  /**
   * لاگ عملیات دسته‌ای
   */
  logBatchOperation(operation, items, duration, options = {}) {
    const { pool = 'default', userId = null } = options;

    const batchData = {
      operation,
      itemCount: items.length,
      duration,
      avgItemDuration: formatDuration(duration / items.length),
      pool,
      userId,
      timestamp: new Date().toISOString(),
    };

    consoleLogger.info(
      `📦 Batch ${operation}: ${items.length} items`,
      { duration: formatDuration(duration) }
    );

    fileLogger.log('info', `Batch ${operation}`, batchData);

    return batchData;
  }

  // ─────────────────────────────────────────────────────────────
  // Query Methods
  // ─────────────────────────────────────────────────────────────
  
  /**
   * جستجو در تاریخچه کوئری‌ها
   */
  searchQueries(query, options = {}) {
    return this.history.search(query, options);
  }

  /**
   * دریافت کوئری با ID
   */
  getQueryById(id) {
    return this.history.getById(id);
  }

  /**
   * دریافت کوئری‌های آهسته
   */
  getSlowQueries(limit = 10) {
    return this.history.search('', { slowOnly: true, limit });
  }

  /**
   * دریافت کوئری‌های خاص
   */
  getQueriesByType(type, limit = 10) {
    return this.history.search('', { type, limit });
  }

  /**
   * دریافت کوئری‌های خاص جدول
   */
  getQueriesByTable(table, limit = 10) {
    return this.history.search('', { table, limit });
  }

  // ─────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────

  /**
   * دریافت آمار کلی
   */
  getStats() {
    const historyStats = this.history.getStats();
    const poolStats = this.poolManager.getAllPoolsStats();
    const uptime = Date.now() - this.startTime;
    const queriesPerSecond = (this.queryCount / (uptime / 1000)).toFixed(2);

    return {
      totalQueries: this.queryCount,
      uptime: formatDuration(uptime),
      queriesPerSecond: parseFloat(queriesPerSecond),
      history: historyStats,
      pools: poolStats,
      activeTransactions: this.activeTransactions.size,
    };
  }

  /**
   * دریافت آمار pool خاص
   */
  getPoolStats(poolName) {
    return this.poolManager.getPoolStats(poolName);
  }

  /**
   * دریافت آمار تراکنش‌های فعال
   */
  getActiveTransactions() {
    return Array.from(this.activeTransactions.values()).map(t => ({
      id: t.id,
      duration: formatDuration(Date.now() - t.startTime),
      queryCount: t.queries.length,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * پاک کردن تاریخچه
   */
  clear() {
    this.history.clear();
    this.queryCount = 0;
    this.startTime = Date.now();
    consoleLogger.info('🗑️ Database query history cleared');
  }

  /**
   * تنظیم آستانه کوئری آهسته
   */
  setSlowThreshold(ms) {
    CONFIG.slowQueryThreshold = ms;
    consoleLogger.info(`Slow query threshold set to ${ms}ms`);
  }

  /**
   * تنظیم آستانه کوئری خیلی آهسته
   */
  setVerySlowThreshold(ms) {
    CONFIG.verySlowQueryThreshold = ms;
    consoleLogger.info(`Very slow query threshold set to ${ms}ms`);
  }

  /**
   * فعال/غیرفعال لاگ پارامترها
   */
  setLogParams(enabled) {
    CONFIG.logParams = enabled;
  }

  /**
   * فعال/غیرفعال لاگ نتیجه
   */
  setLogResult(enabled) {
    CONFIG.logResult = enabled;
  }

  /**
   * دریافت کوئری‌های اخیر
   */
  getRecentQueries(limit = 10) {
    return this.history.queries.slice(-limit).reverse();
  }

  /**
   * خروجی CSV
   */
  exportToCSV(queries = null) {
    const data = queries || this.history.queries;
    
    const headers = ['ID', 'Timestamp', 'Type', 'Duration', 'Tables', 'Slow', 'Query'];
    const rows = data.map(q => [
      q.id,
      q.timestamp,
      q.analysis?.type || 'OTHER',
      q.duration,
      q.analysis?.tables?.join(';') || '',
      q.slow ? 'Yes' : 'No',
      `"${q.query.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * خروجی JSON
   */
  exportToJSON(queries = null) {
    return JSON.stringify(queries || this.history.queries, null, 2);
  }
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = new DatabaseLogger();