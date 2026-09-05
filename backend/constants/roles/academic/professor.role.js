// ==========================================
// academic/professor.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'professor',

    name: 'Professor',
    displayName: 'استاد',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.HIGH,
    riskLevel: RISK_LEVELS.MEDIUM,

    scope: ACCESS_SCOPES.DEPARTMENT,

    inherits: ['student'],

    permissions: [
        'course:create',
        'course:update',
        'course:delete',

        'assignment:create',
        'assignment:grade',

        'exam:create',
        'exam:grade',

        'student:evaluate',

        'live:start',
        'live:manage',

        'research:create',
        'research:manage',

        'attendance:manage'
    ],

    restrictions: {
        requiresMFA: true,
        sessionTimeout: 3600
    },

    metadata: {
        color: '#DC2626',
        icon: 'BookOpen',
        badge: 'PROFESSOR'
    }
};