// ==========================================
// backend/constants/index.js
// Global Constants Hub
// ==========================================

const roles = require('./roles');

// ===============================
// APP
// ===============================

const APP = {
    NAME: 'Roshana',
    VERSION: '1.0.0',
    ENV: process.env.NODE_ENV || 'development',

    API_PREFIX: '/api',

    DEFAULT_LANGUAGE: 'fa',

    TIMEZONE: 'Asia/Tehran'
};

// ===============================
// SECURITY
// ===============================

const SECURITY = {

    JWT: {
        ACCESS_EXPIRES_IN: '15m',
        REFRESH_EXPIRES_IN: '30d',

        ISSUER: 'roshana-auth',

        ALGORITHM: 'HS256'
    },

    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,

        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true
    },

    MFA: {
        ENABLED: true,

        ISSUER: 'Roshana',

        WINDOW: 1
    },

    SESSION: {
        MAX_DEVICES: 5,

        IDLE_TIMEOUT: 1000 * 60 * 60,

        ABSOLUTE_TIMEOUT: 1000 * 60 * 60 * 24
    }
};

// ===============================
// CACHE
// ===============================

const CACHE = {

    TTL: {
        SHORT: 1000 * 30,
        MEDIUM: 1000 * 60 * 5,
        LONG: 1000 * 60 * 60,
        DAY: 1000 * 60 * 60 * 24
    },

    PREFIXES: {
        USER: 'user:',
        ROLE: 'role:',
        SESSION: 'session:',
        PERMISSION: 'permission:',
        CACHE: 'cache:'
    }
};

// ===============================
// EVENTS
// ===============================

const EVENTS = {

    AUTH: {
        LOGIN: 'auth:login',
        LOGOUT: 'auth:logout',
        REGISTER: 'auth:register',
        PASSWORD_CHANGED: 'auth:password_changed',
        MFA_ENABLED: 'auth:mfa_enabled'
    },

    ROLE: {
        ASSIGNED: 'role:assigned',
        REMOVED: 'role:removed',
        UPDATED: 'role:updated',
        CREATED: 'role:created'
    },

    SECURITY: {
        ACCESS_DENIED: 'security:access_denied',
        ANOMALY_DETECTED: 'security:anomaly_detected',
        SUSPICIOUS_ACTIVITY: 'security:suspicious_activity'
    },

    SYSTEM: {
        CACHE_CLEARED: 'system:cache_cleared',
        SYSTEM_BOOTED: 'system:booted',
        CONFIG_UPDATED: 'system:config_updated'
    }
};

// ===============================
// LIMITS
// ===============================

const LIMITS = {

    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100
    },

    UPLOAD: {
        MAX_FILE_SIZE: 1024 * 1024 * 20,
        MAX_FILES: 10
    },

    RATE_LIMIT: {
        WINDOW_MS: 1000 * 60,
        MAX_REQUESTS: 120
    }
};

// ===============================
// STATUS
// ===============================

const STATUS = {

    USER: {
        ACTIVE: 'active',
        SUSPENDED: 'suspended',
        BANNED: 'banned',
        PENDING: 'pending'
    },

    SYSTEM: {
        ONLINE: 'online',
        OFFLINE: 'offline',
        MAINTENANCE: 'maintenance'
    }
};

// ===============================
// ERRORS
// ===============================

const ERRORS = {

    AUTH: {
        INVALID_TOKEN: 'INVALID_TOKEN',
        TOKEN_EXPIRED: 'TOKEN_EXPIRED',
        ACCESS_DENIED: 'ACCESS_DENIED',
        INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
    },

    ROLE: {
        ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
        INVALID_ROLE: 'INVALID_ROLE',
        CIRCULAR_INHERITANCE: 'CIRCULAR_INHERITANCE'
    },

    SYSTEM: {
        INTERNAL_ERROR: 'INTERNAL_ERROR',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
    }
};

// ===============================
// REGEX
// ===============================

const REGEX = {

    USERNAME: /^[a-zA-Z0-9_]{3,30}$/,

    PASSWORD:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,128}$/,

    EMAIL:
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    OBJECT_ID:
        /^[0-9a-fA-F]{24}$/
};

// ===============================
// EXPORTS
// ===============================

module.exports = {

    APP,
    SECURITY,
    CACHE,
    EVENTS,
    LIMITS,
    STATUS,
    ERRORS,
    REGEX,

    // Roles System
    roles
};