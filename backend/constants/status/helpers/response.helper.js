// ============================================
// 📁 response.helper.js
// 🚀 Standard API Response Helper
// ============================================

const {
  getStatus,
  getMessage
} = require('./status.helper');

/**
 * ✅ Success Response
 */
function success({
  status = 'OK',
  lang = 'fa',
  data = null,
  meta = {},
  message = null
} = {}) {

  const statusData = getStatus(status);

  return {
    success: true,
    code: statusData.code,
    status: statusData.name,
    message: message || getMessage(status, lang),
    data,
    meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * ❌ Error Response
 */
function error({
  status = 'INTERNAL_SERVER_ERROR',
  lang = 'fa',
  error = null,
  errors = [],
  message = null
} = {}) {

  const statusData = getStatus(status);

  return {
    success: false,
    code: statusData.code,
    status: statusData.name,
    message: message || getMessage(status, lang),
    error,
    errors,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  success,
  error
};
