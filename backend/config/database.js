// ============================================
// 🚀 Roshana Database Configuration Engine
// Enterprise PostgreSQL + Knex Config System
// ============================================

require('dotenv').config();

const path = require('path');
const chalk = require('chalk');

// ============================================
// 🌍 Environment
// ============================================

const ENV = process.env.NODE_ENV || 'development';

const isDev = ENV === 'development';
const isProd = ENV === 'production';
const isTest = ENV === 'test';

// ============================================
// 🧠 Helpers
// ============================================

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback = false) => {
    if (value === undefined) return fallback;
    return value === 'true' || value === true;
};

// ============================================
// 📁 Paths
// ============================================

const ROOT_DIR = path.resolve(__dirname, '..');

const PATHS = {
    root: ROOT_DIR,

    migrations: path.join(ROOT_DIR, 'database', 'migrations'),

    seeds: path.join(ROOT_DIR, 'database', 'seeders'),

    logs: path.join(ROOT_DIR, 'logs'),

    backups: path.join(ROOT_DIR, 'backups'),

    uploads: path.join(ROOT_DIR, 'uploads')
};

// ============================================
// 🛢️ PostgreSQL Connection
// ============================================

const DATABASE = {
    client: 'pg',

    connection: {
        host: process.env.DB_HOST || '127.0.0.1',

        port: toNumber(process.env.DB_PORT, 5432),

        user: process.env.DB_USER || 'postgres',

        password: process.env.DB_PASSWORD || '',

        database: process.env.DB_NAME || 'roshana_db',

        charset: 'utf8',

        ssl: toBool(process.env.DB_SSL, false)
            ? {
                rejectUnauthorized: false
            }
            : false
    },

    pool: {
        min: toNumber(process.env.DB_POOL_MIN, 2),

        max: toNumber(process.env.DB_POOL_MAX, 20),

        idleTimeoutMillis: toNumber(
            process.env.DB_POOL_IDLE_TIMEOUT,
            30000
        ),

        acquireTimeoutMillis: toNumber(
            process.env.DB_POOL_ACQUIRE_TIMEOUT,
            60000
        ),

        createTimeoutMillis: 30000,

        destroyTimeoutMillis: 5000,

        reapIntervalMillis: 1000,

        createRetryIntervalMillis: 200
    },

    migrations: {
        directory: PATHS.migrations,

        tableName: 'knex_migrations',

        extension: 'js'
    },

    seeds: {
        directory: PATHS.seeds
    },

    acquireConnectionTimeout: 60000,

    debug: toBool(process.env.DB_DEBUG, isDev),

    asyncStackTraces: isDev
};

// ============================================
// ⚡ Query Performance
// ============================================

const PERFORMANCE = {
    slowQueryThreshold: toNumber(
        process.env.DB_SLOW_QUERY_MS,
        100
    ),

    maxQueryLog: toNumber(
        process.env.DB_MAX_QUERY_LOG,
        100
    ),

    enableQueryCache: toBool(
        process.env.DB_ENABLE_CACHE,
        true
    ),

    cacheTTL: toNumber(
        process.env.DB_CACHE_TTL,
        30000
    ),

    maxCacheSize: toNumber(
        process.env.DB_CACHE_MAX,
        1000
    )
};

// ============================================
// 🩺 Health Monitoring
// ============================================

const HEALTH = {
    enabled: true,

    interval: toNumber(
        process.env.DB_HEALTH_INTERVAL,
        60000
    ),

    timeout: toNumber(
        process.env.DB_HEALTH_TIMEOUT,
        5000
    ),

    autoReconnect: true,

    maxReconnectRetries: toNumber(
        process.env.DB_RETRIES,
        5
    )
};

// ============================================
// 🔒 Security
// ============================================

const SECURITY = {
    enableSanitization: true,

    allowRawQueries: toBool(
        process.env.DB_ALLOW_RAW,
        false
    ),

    maskSensitiveLogs: true,

    blockedKeywords: [
        'DROP',
        'TRUNCATE',
        'ALTER',
        'GRANT',
        'REVOKE'
    ]
};

// ============================================
// 📊 Monitoring
// ============================================

const MONITORING = {
    enabled: true,

    console: isDev,

    logQueries: toBool(
        process.env.DB_LOG_QUERIES,
        isDev
    ),

    logErrors: true,

    logSlowQueries: true,

    logConnections: true
};

// ============================================
// 🧾 Logger
// ============================================

const LOGGER = {
    warn(message) {
        console.log(
            chalk.yellow(`⚠️ DATABASE WARNING: ${message}`)
        );
    },

    error(message) {
        console.log(
            chalk.red(`❌ DATABASE ERROR: ${message}`)
        );
    },

    deprecate(message) {
        console.log(
            chalk.gray(`📌 DATABASE NOTICE: ${message}`)
        );
    },

    debug(message) {
        if (isDev) {
            console.log(
                chalk.cyan(`🔍 DATABASE DEBUG: ${message}`)
            );
        }
    }
};

// ============================================
// 🧪 Test Config
// ============================================

const TEST_DATABASE = {
    ...DATABASE,

    connection: {
        ...DATABASE.connection,

        database:
            process.env.DB_TEST_NAME ||
            'roshana_test_db'
    },

    pool: {
        min: 1,
        max: 5
    }
};

// ============================================
// 📦 Final Config
// ============================================

const CONFIG = {
    env: ENV,

    isDev,
    isProd,
    isTest,

    database: isTest
        ? TEST_DATABASE
        : DATABASE,

    paths: PATHS,

    performance: PERFORMANCE,

    health: HEALTH,

    security: SECURITY,

    monitoring: MONITORING,

    logger: LOGGER
};

// ============================================
// 🖨️ Startup Banner
// ============================================

if (isDev) {
    console.log(chalk.green.bold(`
╔══════════════════════════════════════╗
║                                      ║
║   🚀 Roshana Database Config Loaded  ║
║                                      ║
╠══════════════════════════════════════╣
║  ENV: ${ENV.padEnd(30)}║
║  DB : ${DATABASE.connection.database.padEnd(30)}║
║  HOST: ${DATABASE.connection.host.padEnd(29)}║
║  PORT: ${String(DATABASE.connection.port).padEnd(29)}║
║                                      ║
╚══════════════════════════════════════╝
    `));
}

// ============================================
// 📤 Exports
// ============================================

module.exports = CONFIG;