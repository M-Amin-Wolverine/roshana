// ==========================================
// registry.js
// ==========================================

const system = require('./system');
const academic = require('./academic');
const organization = require('./organization');
const live = require('./live');
const finance = require('./finance');
const security = require('./security');
const guest = require('./guest');

module.exports = {
    ...system,
    ...academic,
    ...organization,
    ...live,
    ...finance,
    ...security,
    ...guest
};