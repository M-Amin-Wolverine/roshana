// ============================================
// 📁 message.helper.js
// 🌍 Multi Language Message Resolver
// ============================================

const { getStatus } = require('./status.helper');

/**
 * 🌐 Resolve Message
 */
function resolveMessage(name, lang = 'fa') {

  const status = getStatus(name);

  if (!status) {
    return 'Unknown Status';
  }

  return (
    status.message?.[lang] ||
    status.message?.en ||
    'Unknown Message'
  );
}

/**
 * 🎯 Resolve With Params
 */
function resolveTemplate(
  template,
  params = {}
) {

  let result = template;

  Object.entries(params).forEach(
    ([key, value]) => {
      result = result.replace(
        new RegExp(`{${key}}`, 'g'),
        value
      );
    }
  );

  return result;
}

module.exports = {
  resolveMessage,
  resolveTemplate
};