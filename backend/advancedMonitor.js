// advancedMonitor.js - نسخه اصلاح شده با override صحیح

const EventEmitter = require('events');
const logger = require('./utils/logger');

class AdvancedDatabaseMonitor extends EventEmitter {
  constructor(db, io = null, options = {}) {
    super();
    this.db = db;
    this.io = io;
    this.options = {
      enableQueryLogging: true,
      enablePoolMonitoring: true,
      enableCliDashboard: true,
      enableWebSocketEmit: !!io,
      queryHistorySize: 100,
      reconnectInterval: 30000,
      maxReconnectAttempts: 5,
      ...options
    };

    this.stats = {
      totalQueries: 0,
      totalErrors: 0,
      queriesLastSecond: [],
      errorsLastSecond: [],
      latencyLastSecond: [],
      poolStats: { waiting: 0, active: 0, idle: 0, total: 0 },
      lastQuery: null,
      uptimeStart: Date.now(),
      reconnectAttempts: 0,
      lastPingSuccess: null
    };

    this.recentQueries = [];

    // اصلاح: بازنویسی صحیح db.raw
    this.hijackQueries();

    if (this.options.enablePoolMonitoring) {
      this.startPoolMonitoring();
    }
    this.setupAutoReconnect();
    if (this.options.enableCliDashboard && process.stdout.isTTY) {
      this.startCliDashboard();
    }
    logger.info('🚀 Advanced Database Monitor initialized');
  }

  hijackQueries() {
    const self = this;
    // ذخیره متد اصلی raw (با bind به db اصلی)
    const originalRaw = this.db.raw.bind(this.db);

    // تعریف مجدد خاصیت raw با قابلیت نوشتن
    Object.defineProperty(this.db, 'raw', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: async function(sql, bindings) {
        const start = Date.now();
        const queryId = Math.random().toString(36).substr(2, 8);
        const sqlText = typeof sql === 'string' ? sql : sql.toString();

        // emit event before query
        self.emit('query:start', { id: queryId, sql: sqlText, bindings });
        if (self.options.enableQueryLogging) {
          logger.debug(`📝 [${queryId}] START: ${sqlText.substring(0, 200)}`);
        }

        try {
          const result = await originalRaw(sql, bindings);
          const duration = Date.now() - start;
          self.recordQuery(duration, true, sqlText, queryId);
          self.emit('query:complete', { id: queryId, duration, sql: sqlText, success: true });
          if (self.options.enableQueryLogging) {
            logger.debug(`✅ [${queryId}] DONE in ${duration}ms`);
          }
          return result;
        } catch (err) {
          const duration = Date.now() - start;
          self.recordQuery(duration, false, sqlText, queryId);
          self.emit('query:error', { id: queryId, duration, sql: sqlText, error: err.message });
          logger.error(`❌ [${queryId}] ERROR after ${duration}ms: ${err.message}`);
          throw err;
        }
      }
    });
  }

  recordQuery(duration, success, sql, queryId) {
    const now = Date.now();
    const windowMs = 10000;
    const cutoff = now - windowMs;

    this.stats.queriesLastSecond = this.stats.queriesLastSecond.filter(t => t > cutoff);
    this.stats.errorsLastSecond = this.stats.errorsLastSecond.filter(t => t > cutoff);
    this.stats.latencyLastSecond = this.stats.latencyLastSecond.filter(l => l.timestamp > cutoff);

    this.stats.queriesLastSecond.push(now);
    this.stats.latencyLastSecond.push({ timestamp: now, duration });
    if (!success) this.stats.errorsLastSecond.push(now);

    this.stats.totalQueries++;
    if (!success) this.stats.totalErrors++;

    this.recentQueries.unshift({
      sql: sql.substring(0, 200),
      duration,
      success,
      time: new Date(),
      id: queryId
    });
    if (this.recentQueries.length > this.options.queryHistorySize) this.recentQueries.pop();

    if (this.io && this.options.enableWebSocketEmit) {
      this.io.emit('db:query', {
        sql: sql.substring(0, 200),
        duration,
        success,
        timestamp: now,
        totalQueries: this.stats.totalQueries,
        errors: this.stats.totalErrors
      });
    }
    this.emit('metrics', this.getCurrentMetrics());
  }

  async startPoolMonitoring() {
    setInterval(async () => {
      try {
        let poolStats = { waiting: 0, active: 0, idle: 0, total: 0 };
        if (this.db.client && this.db.client.pool) {
          const pool = this.db.client.pool;
          if (typeof pool.numUsed === 'function') {
            poolStats.waiting = pool.numUsed() || 0;
            poolStats.active = pool.numFree() || 0;
            poolStats.idle = pool.numPendingCreates ? pool.numPendingCreates() : 0;
            poolStats.total = poolStats.waiting + poolStats.active;
          } else if (pool._counts) {
            poolStats = {
              waiting: pool._counts.waitingQueueSize || 0,
              active: pool._counts.numUsedByUser || 0,
              idle: pool._counts.numFree || 0,
              total: pool._counts.totalCount || 0
            };
          }
        } else {
          const result = await this.db.raw('SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()');
          const active = parseInt(result.rows[0].count);
          poolStats = { waiting: 0, active, idle: 0, total: active };
        }
        this.stats.poolStats = poolStats;

        if (this.io && this.options.enableWebSocketEmit) {
          this.io.emit('db:pool', poolStats);
        }
        this.emit('pool:stats', poolStats);
      } catch (err) {
        // ignore
      }
    }, 2000);
  }

  setupAutoReconnect() {
    const self = this;
    setInterval(async () => {
      try {
        await this.db.raw('SELECT 1');
        this.stats.lastPingSuccess = new Date().toISOString();
        if (this.stats.reconnectAttempts > 0) {
          logger.info('✅ Database connection restored after reconnect');
          this.stats.reconnectAttempts = 0;
        }
      } catch (err) {
        logger.error(`❌ Database ping failed: ${err.message}`);
        if (this.stats.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.stats.reconnectAttempts++;
          const delay = Math.min(2000 * Math.pow(2, this.stats.reconnectAttempts), 60000);
          logger.warn(`🔄 Reconnecting in ${delay}ms (attempt ${this.stats.reconnectAttempts})`);
          setTimeout(async () => {
            try {
              const knex = require('knex');
              const knexConfig = require('./knexfile');
              const newDb = knex(knexConfig[process.env.NODE_ENV || 'development']);
              await newDb.raw('SELECT 1');
              this.db = newDb;
              global.db = newDb;
              // دوباره override کوئری‌ها (چون db عوض شده)
              this.hijackQueries();
              this.stats.reconnectAttempts = 0;
              logger.info('✅ Database reconnected successfully');
            } catch (reErr) {
              logger.error(`Reconnect failed: ${reErr.message}`);
            }
          }, delay);
        } else {
          logger.error('💀 Max reconnect attempts reached. Exiting process.');
          process.exit(1);
        }
      }
    }, this.options.reconnectInterval);
  }

  getCurrentMetrics() {
    const now = Date.now();
    const windowSeconds = 10;
    const cutoff = now - windowSeconds * 1000;
    const queryCount = this.stats.queriesLastSecond.filter(t => t > cutoff).length;
    const errorCount = this.stats.errorsLastSecond.filter(t => t > cutoff).length;
    const qps = queryCount / windowSeconds;
    const eps = errorCount / windowSeconds;
    const latencies = this.stats.latencyLastSecond.filter(l => l.timestamp > cutoff);
    const avgLatency = latencies.length ? latencies.reduce((sum, l) => sum + l.duration, 0) / latencies.length : 0;

    return {
      uptime: Math.floor((now - this.stats.uptimeStart) / 1000),
      qps: qps.toFixed(2),
      eps: eps.toFixed(2),
      avgLatency: Math.round(avgLatency),
      totalQueries: this.stats.totalQueries,
      totalErrors: this.stats.totalErrors,
      pool: this.stats.poolStats,
      lastQuery: this.recentQueries[0] || null,
      reconnectAttempts: this.stats.reconnectAttempts,
      lastPingSuccess: this.stats.lastPingSuccess
    };
  }

startCliDashboard() {
  setInterval(() => {
    // دیگر console.clear() نداریم – لاگ‌های HTTP باقی می‌مانند
    const m = this.getCurrentMetrics();
    console.log('\n' + '═'.repeat(80));
    console.log('🟢 DATABASE ADVANCED MONITOR');
    console.log('═'.repeat(80));
    console.log(`⏱️  Uptime: ${Math.floor(m.uptime / 60)}m ${m.uptime % 60}s`);
    console.log(`📊 QPS: ${m.qps}  |  EPS: ${m.eps}  |  Avg Latency: ${m.avgLatency}ms`);
    console.log(`🔌 Pool: Active=${m.pool.active} Waiting=${m.pool.waiting} Idle=${m.pool.idle} Total=${m.pool.total}`);
    console.log(`📈 Total Queries: ${m.totalQueries}  |  Errors: ${m.totalErrors}`);
    if (m.reconnectAttempts > 0) console.log(`⚠️  Reconnecting: attempt ${m.reconnectAttempts}`);
    console.log('═'.repeat(80));
    console.log('📝 Last 5 Queries:');
    this.recentQueries.slice(0, 5).forEach(q => {
      const icon = q.success ? '✅' : '❌';
      console.log(`  ${icon} ${q.duration}ms - ${q.sql.substring(0, 70)}...`);
    });
    console.log('═'.repeat(80));
  }, 3000); // هر ۳ ثانیه یکبار به‌روز می‌شود
}}

module.exports = AdvancedDatabaseMonitor;
