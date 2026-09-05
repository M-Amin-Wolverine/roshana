// ============================================
// 🚀 Roshana Config System - index.js
// Enterprise Configuration Loader
// ============================================

'use strict';

// 📦 Core
const path = require('path');
const dotenv = require('dotenv');

// 📥 Internal Modules
const schema = require('./schema');
const ConfigValidator = require('./validator');
const {
    castValue,
    deepFreeze,
    sanitizeConfig,
    getNestedValue
} = require('../utils/env');

// ============================================
// 🌍 Load Environment Variables
// ============================================

dotenv.config({
    path: process.env.ENV_FILE || path.resolve(process.cwd(), '.env')
});

// ============================================
// ⚙️ Config Manager
// ============================================

class ConfigManager {
    constructor() {
        this.schema = schema;
        this.env = process.env.NODE_ENV || 'development';

        this.config = this.build();

        this.validator = new ConfigValidator(
            this.config,
            this.schema
        );

        this.validate();

        // 🔒 Immutable Config
        deepFreeze(this.config);
    }

    // ============================================
    // 🏗️ Build Config Object
    // ============================================

    build() {
        const result = {};

        for (const [section, fields] of Object.entries(this.schema)) {
            result[section] = {};

            for (const [key, options] of Object.entries(fields)) {
                const {
                    env,
                    default: defaultValue,
                    type
                } = options;

                const rawValue =
                    process.env[env] !== undefined
                        ? process.env[env]
                        : defaultValue;

                result[section][key] = castValue(
                    rawValue,
                    type
                );
            }
        }

        return result;
    }

    // ============================================
    // ✅ Validate Config
    // ============================================

    validate() {
        const result = this.validator.validate();

        if (!result.valid) {
            console.error('\n❌ Configuration Error:\n');

            result.errors.forEach(error => {
                console.error(`  • ${error}`);
            });

            console.error('');

            process.exit(1);
        }

        if (result.warnings.length > 0) {
            console.warn('\n⚠️ Configuration Warnings:\n');

            result.warnings.forEach(warning => {
                console.warn(`  • ${warning}`);
            });

            console.warn('');
        }
    }

    // ============================================
    // 📥 Get Value
    // ============================================

    get(path, defaultValue = null) {
        return getNestedValue(
            this.config,
            path,
            defaultValue
        );
    }

    // ============================================
    // 🌍 Environment Helpers
    // ============================================

    isProduction() {
        return this.env === 'production';
    }

    isDevelopment() {
        return this.env === 'development';
    }

    isTest() {
        return this.env === 'test';
    }

    isStaging() {
        return this.env === 'staging';
    }

    // ============================================
    // 🌐 URL Helpers
    // ============================================

    getApiUrl(endpoint = '') {
        return `${this.get('URLS.API_URL')}${endpoint}`;
    }

    getAppUrl(endpoint = '') {
        return `${this.get('URLS.APP_URL')}${endpoint}`;
    }

    getFrontendUrl(endpoint = '') {
        return `${this.get('URLS.FRONTEND_URL')}${endpoint}`;
    }

    // ============================================
    // 🔐 Safe Config
    // ============================================

    toSafeJSON() {
        return sanitizeConfig(
            JSON.parse(JSON.stringify(this.config)),
            this.schema
        );
    }

    // ============================================
    // 📄 Full Config
    // ============================================

    toJSON() {
        return this.config;
    }

    // ============================================
    // 📚 Documentation Generator
    // ============================================

    getDocumentation() {
        const docs = {};

        for (const [section, fields] of Object.entries(this.schema)) {
            docs[section] = {};

            for (const [key, options] of Object.entries(fields)) {
                docs[section][key] = {
                    env: options.env,
                    type: options.type,
                    default: options.default,
                    required: !!options.required,
                    sensitive: !!options.sensitive,
                    description: options.description || ''
                };
            }
        }

        return docs;
    }

    // ============================================
    // 🧪 Health Check
    // ============================================

    healthCheck() {
        return {
            status: 'ok',
            env: this.env,
            app: this.get('METADATA.APP_NAME'),
            version: this.get('METADATA.APP_VERSION'),
            timestamp: new Date().toISOString()
        };
    }
}

// ============================================
// 🏗️ Singleton Instance
// ============================================

const config = new ConfigManager();

// ============================================
// 📤 Exports
// ============================================

module.exports = {

    // Main Instance
    config,

    // Config Access
    get: (path, defaultValue) =>
        config.get(path, defaultValue),

    toJSON: () =>
        config.toJSON(),

    toSafeJSON: () =>
        config.toSafeJSON(),

    // Environment
    isProduction: () =>
        config.isProduction(),

    isDevelopment: () =>
        config.isDevelopment(),

    isTest: () =>
        config.isTest(),

    isStaging: () =>
        config.isStaging(),

    // URL Helpers
    getApiUrl: endpoint =>
        config.getApiUrl(endpoint),

    getAppUrl: endpoint =>
        config.getAppUrl(endpoint),

    getFrontendUrl: endpoint =>
        config.getFrontendUrl(endpoint),

    // Docs
    getDocumentation: () =>
        config.getDocumentation(),

    // Health
    healthCheck: () =>
        config.healthCheck(),

    // Direct Sections
    server: config.config.SERVER,
    security: config.config.SECURITY,
    database: config.config.DATABASE,
    logger: config.config.LOGGER,
    cache: config.config.CACHE,
    upload: config.config.UPLOAD,
    email: config.config.EMAIL,
    sms: config.config.SMS,
    session: config.config.SESSION,
    urls: config.config.URLS,
    metadata: config.config.METADATA
};