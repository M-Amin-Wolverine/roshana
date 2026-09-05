// ============================================
// 📁 status.helper.js
// 🧠 Core Status Helper
// ============================================

const INFORMATIONAL = require('../http/1xx.informational');
const SUCCESS = require('../http/2xx.success');
const REDIRECTION = require('../http/3xx.redirection');
const CLIENT_ERROR = require('../http/4xx.clientError');
const SERVER_ERROR = require('../http/5xx.serverError');

const ALL_STATUS = {
  ...INFORMATIONAL,
  ...SUCCESS,
  ...REDIRECTION,
  ...CLIENT_ERROR,
  ...SERVER_ERROR
};

/**
 * 🎯 Get Status By Name
 */
function getStatus(name) {
  return ALL_STATUS[name] || null;
}

/**
 * 🔍 Get Status By Code
 */
function getStatusByCode(code) {
  return Object.values(ALL_STATUS).find(
    status => status.code === code
  ) || null;
}

/**
 * ✅ Check Success
 */
function isSuccess(code) {
  return code >= 200 && code < 300;
}

/**
 * ❌ Check Client Error
 */
function isClientError(code) {
  return code >= 400 && code < 500;
}

/**
 * 💥 Check Server Error
 */
function isServerError(code) {
  return code >= 500;
}

/**
 * 🌍 Get Message By Lang
 */
function getMessage(name, lang = 'fa') {
  const status = getStatus(name);

  if (!status) return null;

  return (
    status.message?.[lang] ||
    status.message?.en ||
    null
  );
}

module.exports = {
  ALL_STATUS,
  getStatus,
  getStatusByCode,
  isSuccess,
  isClientError,
  isServerError,
  getMessage
};
