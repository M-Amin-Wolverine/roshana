// ==========================================
// academic/dean.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'dean',

    name: 'Dean',
    displayName: 'رئیس دانشکده',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.CRITICAL,
    riskLevel: RISK_LEVELS.CRITICAL,

    scope: ACCESS_SCOPES.SYSTEM,

    inherits: [
        'education_manager'
    ],

    permissions: [
        'faculty:*',
        'department:*',
        'academic:system:*',

        'budget:academic:manage',

        'research:approve',

        'academic:audit:read',

        'strategic:education:manage'
    ],

    restrictions: {
        requiresMFA: true,
        ipWhitelist: true,
        sessionTimeout: 1200
    },

    metadata: {
        color: '#991B1B',
        icon: 'Crown',
        badge: 'DEAN'
    }
};