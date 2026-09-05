// =====================================================
// 🚀 Roshana Database Connection Manager v5.0
// 📂 File: config/connection.js
// 🔥 PostgreSQL + Knex + Auto Recovery + Monitoring
// =====================================================

require('dotenv').config();

const knex = require('knex');
const EventEmitter = require('events');
const chalk = require('chalk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// =====================================================
// ⚙️ Dynamic Environment Config
// =====================================================

const ENV = process.env.NODE_ENV || 'development';

const CONFIG = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roshana_dev',
            charset: 'utf8'
        },
        pool: {
            min: 2,
            max: 20,
            acquireTimeoutMillis: 60000,
            createTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 2000
        },
        debug: true
    },

    production: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: false
            }
        },
        pool: {
            min: 5,
            max: 50,
            acquireTimeoutMillis: 120000,
            idleTimeoutMillis: 60000
        },
        debug: false
    }
};

// =====================================================
// 📡 Connection Manager Class
// =====================================================

class ConnectionManager extends EventEmitter {

    constructor() {
        super();

        this.knex = null;
        this.connected = false;

        this.stats = {
            totalQueries: 0,
            failedQueries: 0,
            reconnects: 0,
            uptime: Date.now(),
            slowQueries: []
        };

        this.queryCache = new Map();

        this.logDir = path.join(process.cwd(), 'logs');

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    // =====================================================
    // 🚀 Initialize Database
    // =====================================================

    async initialize() {

        console.log(chalk.cyan.bold('\n🚀 Initializing Database Connection...\n'));

        try {

            this.knex = knex({
                ...CONFIG[ENV],

                asyncStackTraces: true,

                log: {
                    warn(message) {
                        console.log(chalk.yellow(`⚠️ ${message}`));
                    },

                    error(message) {
                        console.log(chalk.red(`❌ ${message}`));
                    },

                    deprecate(message) {
                        console.log(chalk.gray(`📌 ${message}`));
                    },

                    debug(message) {
                        if (ENV === 'development') {
                            console.log(chalk.blue(`🔍 ${message}`));
                        }
                    }
                }
            });

            await this.testConnection();

            this.connected = true;

            this.startHealthMonitor();

            this.startMemoryCleaner();

            this.emit('connected');

            console.log(chalk.green.bold('✅ PostgreSQL Connected Successfully\n'));

            return this.knex;

        } catch (error) {

            this.connected = false;

            console.log(chalk.red.bold('\n❌ Database Initialization Failed\n'));

            console.log(error);

            this.emit('error', error);

            process.exit(1);
        }
    }

    // =====================================================
    // 🧪 Test Connection
    // =====================================================

    async testConnection() {

        const start = Date.now();

        const result = await this.knex.raw(`
            SELECT NOW() as time,
                   version() as version
        `);

        const duration = Date.now() - start;

        console.log(chalk.green(`⚡ Connected in ${duration}ms`));

        console.log(
            chalk.cyan(
                `🛢 PostgreSQL: ${
                    result.rows[0].version.split(' ')[1]
                }`
            )
        );
    }

    // =====================================================
    // 🔍 Raw Query Executor
    // =====================================================

    async query(sql, bindings = [], options = {}) {

        const queryId = crypto.randomBytes(6).toString('hex');

        const start = Date.now();

        try {

            this.stats.totalQueries++;

            this.emit('query:start', {
                id: queryId,
                sql,
                bindings
            });

            // =========================================
            // 💾 Cache Layer
            // =========================================

            if (
                options.cache &&
                sql.trim().toUpperCase().startsWith('SELECT')
            ) {

                const cacheKey = crypto
                    .createHash('md5')
                    .update(sql + JSON.stringify(bindings))
                    .digest('hex');

                const cached = this.queryCache.get(cacheKey);

                if (cached) {

                    const isValid =
                        Date.now() - cached.timestamp <
                        (options.ttl || 30000);

                    if (isValid) {

                        console.log(
                            chalk.gray(`💾 Cache Hit → ${cacheKey}`)
                        );

                        return cached.data;
                    }
                }
            }

            // =========================================
            // 🚀 Execute Query
            // =========================================

            const result = await this.knex.raw(sql, bindings);

            const duration = Date.now() - start;

            // =========================================
            // 🐢 Slow Query Detection
            // =========================================

            if (duration > 150) {

                this.stats.slowQueries.push({
                    sql,
                    duration,
                    time: new Date()
                });

                if (this.stats.slowQueries.length > 50) {
                    this.stats.slowQueries.shift();
                }

                console.log(
                    chalk.yellow(
                        `🐢 Slow Query (${duration}ms)`
                    )
                );
            }

            // =========================================
            // 💾 Save Cache
            // =========================================

            if (
                options.cache &&
                sql.trim().toUpperCase().startsWith('SELECT')
            ) {

                const cacheKey = crypto
                    .createHash('md5')
                    .update(sql + JSON.stringify(bindings))
                    .digest('hex');

                this.queryCache.set(cacheKey, {
                    timestamp: Date.now(),
                    data: result.rows
                });
            }

            this.emit('query:success', {
                id: queryId,
                duration
            });

            return result.rows;

        } catch (error) {

            this.stats.failedQueries++;

            this.emit('query:error', {
                id: queryId,
                error
            });

            this.writeErrorLog(error);

            throw error;
        }
    }

    // =====================================================
    // 📊 Database Stats
    // =====================================================

    async getStats() {

        try {

            const activeConnections = await this.query(`
                SELECT COUNT(*) as total
                FROM pg_stat_activity
            `);

            return {
                connected: this.connected,
                uptime:
                    Math.floor(
                        (Date.now() - this.stats.uptime) / 1000
                    ) + 's',

                totalQueries: this.stats.totalQueries,
                failedQueries: this.stats.failedQueries,

                reconnects: this.stats.reconnects,

                activeConnections:
                    activeConnections[0]?.total || 0,

                cacheSize: this.queryCache.size,

                slowQueries:
                    this.stats.slowQueries.length
            };

        } catch {

            return {
                connected: false
            };
        }
    }

    // =====================================================
    // ❤️ Health Monitor
    // =====================================================

    startHealthMonitor() {

        setInterval(async () => {

            try {

                await this.knex.raw('SELECT 1');

                console.log(
                    chalk.green(
                        `💚 DB Health OK → ${new Date().toLocaleTimeString()}`
                    )
                );

            } catch (error) {

                console.log(
                    chalk.red(
                        '🚨 Database Health Failed'
                    )
                );

                this.connected = false;

                this.emit('health:error', error);

                await this.reconnect();
            }

        }, 60000);
    }

    // =====================================================
    // 🔄 Auto Reconnect
    // =====================================================

    async reconnect() {

        console.log(
            chalk.yellow.bold('\n🔄 Reconnecting Database...\n')
        );

        try {

            this.stats.reconnects++;

            if (this.knex) {
                await this.knex.destroy();
            }

            this.knex = knex(CONFIG[ENV]);

            await this.testConnection();

            this.connected = true;

            console.log(
                chalk.green.bold('✅ Reconnected Successfully\n')
            );

        } catch (error) {

            console.log(
                chalk.red.bold('❌ Reconnect Failed\n')
            );

            this.writeErrorLog(error);
        }
    }

    // =====================================================
    // 🧹 Memory Cleaner
    // =====================================================

    startMemoryCleaner() {

        setInterval(() => {

            if (this.queryCache.size > 1000) {

                const keys = Array.from(this.queryCache.keys());

                keys.slice(0, 300).forEach(key => {
                    this.queryCache.delete(key);
                });

                console.log(
                    chalk.gray('🧹 Cache Cleaned')
                );
            }

        }, 300000);
    }

    // =====================================================
    // 📝 Error Logger
    // =====================================================

    writeErrorLog(error) {

        const logFile = path.join(
            this.logDir,
            'database-error.log'
        );

        const log = `
====================================================
TIME: ${new Date().toISOString()}
MESSAGE: ${error.message}
STACK:
${error.stack}
====================================================

`;

        fs.appendFileSync(logFile, log);
    }

    // =====================================================
    // 🛑 Close Connection
    // =====================================================

    async close() {

        if (this.knex) {

            await this.knex.destroy();

            this.connected = false;

            console.log(
                chalk.green.bold(
                    '\n🛑 Database Connection Closed\n'
                )
            );
        }
    }
}

// =====================================================
// 🌟 Singleton Export
// =====================================================

const DB = new ConnectionManager();

module.exports = DB;