'use strict';

const path = require('path');
const dotenv = require('dotenv');

// ============================================
// 🌍 Load ENV
// ============================================

const envFile = process.env.ENV_FILE || '.env';

dotenv.config({
    path: path.resolve(process.cwd(), envFile)
});

// ============================================
// 🧪 Environment Helpers
// ============================================

const environment = {

    env: process.env.NODE_ENV || 'development',

    isProduction() {
        return this.env === 'production';
    },

    isDevelopment() {
        return this.env === 'development';
    },

    isTest() {
        return this.env === 'test';
    },

    isStaging() {
        return this.env === 'staging';
    }

};

// ============================================
// 📤 Exports
// ============================================

module.exports = {
    env: process.env,
    environment
};