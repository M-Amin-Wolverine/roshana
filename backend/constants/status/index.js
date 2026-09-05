// ============================================
// 📁 File: constants/status/index.js
// ============================================

const INFORMATIONAL_STATUS = require('./http/1xx.informational');
const SUCCESS_STATUS = require('./http/2xx.success');
const REDIRECTION_STATUS = require('./http/3xx.redirection');
const CLIENT_ERROR_STATUS = require('./http/4xx.clientError');
const SERVER_ERROR_STATUS = require('./http/5xx.serverError');

const AUTH_STATUS = require('./custom/auth.status');
const BUSINESS_STATUS = require('./custom/business.status');
const SERVICE_STATUS = require('./custom/service.status');
const VALIDATION_STATUS = require('./custom/validation.status');

const CUSTOM_STATUS = require('./custom');

const statusHelper = require('./helpers/status.helper');
const messageHelper = require('./helpers/message.helper');
const categoryHelper = require('./helpers/category.helper');
const responseHelper = require('./helpers/response.helper');

const responseBuilder = require('./builders/response.builder');
const successBuilder = require('./builders/success.builder');
const errorBuilder = require('./builders/error.builder');
const apiResponseBuilder = require('./builders/apiResponse.builder');

// ============================================
// 🌐 HTTP STATUS
// ============================================

const HTTP_STATUS = {
  ...INFORMATIONAL_STATUS,
  ...SUCCESS_STATUS,
  ...REDIRECTION_STATUS,
  ...CLIENT_ERROR_STATUS,
  ...SERVER_ERROR_STATUS,
};

// ============================================
// 🎯 CUSTOM STATUS
// ============================================

const ALL_CUSTOM_STATUS = {
  ...AUTH_STATUS,
  ...BUSINESS_STATUS,
  ...SERVICE_STATUS,
  ...VALIDATION_STATUS,
};

// ============================================
// 🚀 ALL STATUS
// ============================================

const ALL_STATUS = {
  ...HTTP_STATUS,
  ...ALL_CUSTOM_STATUS,
};

// ============================================
// 📦 EXPORTS
// ============================================

module.exports = {
  // =========================
  // HTTP
  // =========================
  HTTP_STATUS,
  INFORMATIONAL_STATUS,
  SUCCESS_STATUS,
  REDIRECTION_STATUS,
  CLIENT_ERROR_STATUS,
  SERVER_ERROR_STATUS,

  // =========================
  // CUSTOM
  // =========================
  CUSTOM_STATUS,
  AUTH_STATUS,
  BUSINESS_STATUS,
  SERVICE_STATUS,
  VALIDATION_STATUS,

  // =========================
  // ALL
  // =========================
  ALL_STATUS,

  // =========================
  // HELPERS
  // =========================
  statusHelper,
  messageHelper,
  categoryHelper,
  responseHelper,

  // =========================
  // BUILDERS
  // =========================
  responseBuilder,
  successBuilder,
  errorBuilder,
  apiResponseBuilder,
};