// ==========================================
// financialManager.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'financial_manager',

    name: 'Financial Manager',
    displayName: 'مدیر مالی',

    category: ROLE_CATEGORIES.FINANCE,
    priority: ROLE_PRIORITIES.CRITICAL,
    riskLevel: RISK_LEVELS.CRITICAL,

    scope: ACCESS_SCOPES.SYSTEM,

    inherits: [
        'accountant',
        'billing_admin'
    ],

    permissions: [
        'finance:*',
        'finance:budget:*',
        'finance:audit:*',
        'finance:forecast:*',
        'finance:analytics:*',
        'finance:export:*',
        'finance:settings:update',
        'finance:salary:manage',
        'finance:payroll:*',
        'finance:treasury:*'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: true,
        sessionTimeout: 1200,
        allowNightAccess: false
    },

    metadata: {
        color: '#DC2626',
        icon: 'BarChart4',
        badge: 'FINANCIAL_MANAGER'
    }
};