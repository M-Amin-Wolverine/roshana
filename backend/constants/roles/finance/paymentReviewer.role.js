// ==========================================
// paymentReviewer.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'payment_reviewer',

    name: 'Payment Reviewer',
    displayName: 'بازبین پرداخت',

    category: ROLE_CATEGORIES.FINANCE,
    priority: ROLE_PRIORITIES.HIGH,
    riskLevel: RISK_LEVELS.HIGH,

    scope: ACCESS_SCOPES.ORGANIZATION,

    inherits: ['accountant'],

    permissions: [
        'payment:read',
        'payment:review',
        'payment:approve',
        'payment:reject',
        'payment:fraud:detect',
        'payment:history:read',
        'payment:report:generate',
        'finance:chargeback:review'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: false,
        sessionTimeout: 2400
    },

    metadata: {
        color: '#8B5CF6',
        icon: 'ShieldCheck',
        badge: 'PAYMENT_REVIEWER'
    }
};