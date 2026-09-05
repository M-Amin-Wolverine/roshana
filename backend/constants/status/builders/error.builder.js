// ============================================
// 📁 error.builder.js
// 💥 Error Response Builder
// ============================================

const { getStatus } = require('../helpers/status.helper');

function buildError({
  status = 'INTERNAL_SERVER_ERROR',
  lang = 'fa',
  error = null,
  errors = [],
  message = null
} = {}) {

  const statusData = getStatus(status);

  return {
    success: false,
    code: statusData?.code || 500,
    status: statusData?.name || 'INTERNAL_SERVER_ERROR',
    message: message || statusData?.message?.[lang] || statusData?.message?.en,
    error,
    errors,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  buildError
};
