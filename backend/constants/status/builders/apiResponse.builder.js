// ============================================
// 📁 apiResponse.builder.js
// 🌍 Full API Response Engine (PRO LEVEL)
// ============================================

const { buildResponse } = require('./response.builder');

/**
 * 🚀 Main API Response Wrapper
 */
function apiResponse(req, res) {

  return {
    success(status = 'OK', data = null, meta = {}, lang = 'fa') {
      return res.json(
        buildResponse({
          success: true,
          status,
          data,
          meta,
          lang
        })
      );
    },

    error(status = 'INTERNAL_SERVER_ERROR', error = null, errors = [], lang = 'fa') {
      return res.status(500).json(
        buildResponse({
          success: false,
          status,
          error,
          errors,
          lang
        })
      );
    },

    custom({
      success = true,
      status,
      data,
      error,
      errors,
      meta,
      lang = 'fa'
    }) {
      return res.status(success ? 200 : 400).json(
        buildResponse({
          success,
          status,
          data,
          error,
          errors,
          meta,
          lang
        })
      );
    }
  };
}

module.exports = {
  apiResponse
};
