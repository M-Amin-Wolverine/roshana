// ==========================================
// accountant.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'accountant',

    name: 'Accountant',
    displayName: 'حسابدار',

    category: ROLE_CATEGORIES.FINANCE,
    priority: ROLE_PRIORITIES.MEDIUM,
    riskLevel: RISK_LEVELS.MEDIUM,

    scope: ACCESS_SCOPES.DEPARTMENT,

    inherits: ['guest'],

    permissions: [
        'finance:read',
        'finance:transactions:read',
        'finance:invoice:read',
        'finance:invoice:create',
        'finance:invoice:update',
        'finance:payment:read',
        'finance:payment:verify',
        'finance:report:read',
        'finance:report:generate',
        'billing:read',
        'billing:history:read'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: false,
        sessionTimeout: 3600
    },

    metadata: {
        color: '#10B981',
        icon: 'Wallet',
        badge: 'ACCOUNTANT'
    }
};