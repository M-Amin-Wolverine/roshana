// ==========================================
// academic/educationManager.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'education_manager',

    name: 'Education Manager',
    displayName: 'مدیر آموزش',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.CRITICAL,
    riskLevel: RISK_LEVELS.HIGH,

    scope: ACCESS_SCOPES.ORGANIZATION,

    inherits: [
        'department_manager'
    ],

    permissions: [
        'education:*',
        'curriculum:*',

        'semester:manage',
        'grading:system:manage',

        'academic:policies:update',

        'student:records:manage',

        'education:analytics:*'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: true,
        sessionTimeout: 1800
    },

    metadata: {
        color: '#7C2D12',
        icon: 'School',
        badge: 'EDUCATION_MANAGER'
    }
};