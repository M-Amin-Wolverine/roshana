// ============================================
// 📁 response.builder.js
// 🧠 Smart Unified Response Builder
// ============================================

const { buildSuccess } = require('./success.builder');
const { buildError } = require('./error.builder');

/**
 * 🎯 Smart Response (Auto Detect)
 */
function buildResponse(options = {}) {

  const {
    success = true,
    ...rest
  } = options;

  if (success) {
    return buildSuccess(rest);
  }

  return buildError(rest);
}

module.exports = {
  buildResponse
};
