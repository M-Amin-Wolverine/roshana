// ============================================
// 📁 index.js
// 🚀 Custom Status Aggregator
// ============================================

const AUTH_STATUS = require('./auth.status');
const VALIDATION_STATUS = require('./validation.status');
const SERVICE_STATUS = require('./service.status');
const BUSINESS_STATUS = require('./business.status');

module.exports = {
  ...AUTH_STATUS,
  ...VALIDATION_STATUS,
  ...SERVICE_STATUS,
  ...BUSINESS_STATUS
};