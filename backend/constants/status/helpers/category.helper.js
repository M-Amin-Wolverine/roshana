// ============================================
// 📁 category.helper.js
// 🗂️ Status Category Helper
// ============================================

function getCategory(code) {

  if (code >= 100 && code < 200) {
    return 'INFORMATIONAL';
  }

  if (code >= 200 && code < 300) {
    return 'SUCCESS';
  }

  if (code >= 300 && code < 400) {
    return 'REDIRECTION';
  }

  if (code >= 400 && code < 500) {
    return 'CLIENT_ERROR';
  }

  if (code >= 500) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN';
}

function isError(code) {
  return code >= 400;
}

function isRedirect(code) {
  return code >= 300 && code < 400;
}

module.exports = {
  getCategory,
  isError,
  isRedirect
};