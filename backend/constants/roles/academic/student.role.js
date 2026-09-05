// ==========================================
// academic/student.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'student',

    name: 'Student',
    displayName: 'دانشجو',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.LOW,
    riskLevel: RISK_LEVELS.LOW,

    scope: ACCESS_SCOPES.PERSONAL,

    inherits: ['guest'],

    permissions: [
        'profile:read:self',
        'profile:update:self',

        'course:read',
        'course:enroll',
        'course:progress:read',

        'assignment:read',
        'assignment:submit',

        'exam:read',
        'exam:participate',

        'live:view',

        'notification:read:self'
    ],

    restrictions: {
        requiresMFA: false,
        sessionTimeout: 7200
    },

    metadata: {
        color: '#2563EB',
        icon: 'GraduationCap',
        badge: 'STUDENT'
    }
};