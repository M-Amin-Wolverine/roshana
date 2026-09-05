// ==========================================
// academic/eliteStudent.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'elite_student',

    name: 'Elite Student',
    displayName: 'دانشجوی برتر',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.MEDIUM,
    riskLevel: RISK_LEVELS.LOW,

    scope: ACCESS_SCOPES.PERSONAL,

    inherits: ['student'],

    permissions: [
        'research:read',
        'research:participate',

        'library:premium',

        'event:vip:access',

        'scholarship:request',

        'community:moderate'
    ],

    restrictions: {
        requiresMFA: false,
        sessionTimeout: 7200
    },

    metadata: {
        color: '#7C3AED',
        icon: 'Sparkles',
        badge: 'ELITE_STUDENT'
    }
};