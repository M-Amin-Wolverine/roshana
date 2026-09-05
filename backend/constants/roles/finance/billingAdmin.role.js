// ==========================================
// billingAdmin.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'billing_admin',

    name: 'Billing Admin',
    displayName: 'مدیر صورتحساب',

    category: ROLE_CATEGORIES.FINANCE,
    priority: ROLE_PRIORITIES.HIGH,
    riskLevel: RISK_LEVELS.HIGH,

    scope: ACCESS_SCOPES.SYSTEM,

    inherits: ['accountant'],

    permissions: [
        'billing:*',
        'finance:invoice:*',
        'finance:subscription:*',
        'finance:refund:*',
        'finance:chargeback:*',
        'finance:tax:*',
        'payment:gateway:manage',
        'payment:provider:manage',
        'billing:settings:update'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: true,
        sessionTimeout: 1800
    },

    metadata: {
        color: '#F59E0B',
        icon: 'Receipt',
        badge: 'BILLING_ADMIN'
    }
};