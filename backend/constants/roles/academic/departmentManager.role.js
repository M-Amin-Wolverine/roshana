// ==========================================
// academic/departmentManager.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'department_manager',

    name: 'Department Manager',
    displayName: 'مدیر دپارتمان',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.HIGH,
    riskLevel: RISK_LEVELS.HIGH,

    scope: ACCESS_SCOPES.DEPARTMENT,

    inherits: [
        'professor',
        'assistant_professor'
    ],

    permissions: [
        'department:manage',
        'department:analytics',

        'faculty:assign',
        'faculty:evaluate',

        'schedule:manage',

        'academic:report:generate'
    ],

    restrictions: {
        requiresMFA: true,
        sessionTimeout: 2400
    },

    metadata: {
        color: '#0891B2',
        icon: 'Building2',
        badge: 'DEPARTMENT_MANAGER'
    }
};