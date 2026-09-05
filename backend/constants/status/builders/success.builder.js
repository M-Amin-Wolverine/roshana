// ============================================
// 📁 success.builder.js
// 🚀 Success Response Builder
// ============================================

const { getStatus } = require('../helpers/status.helper');

function buildSuccess({
  status = 'OK',
  lang = 'fa',
  data = null,
  meta = {},
  message = null
} = {}) {

  const statusData = getStatus(status);

  return {
    success: true,
    code: statusData?.code || 200,
    status: statusData?.name || 'OK',
    message: message || statusData?.message?.[lang] || statusData?.message?.en,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  buildSuccess
};