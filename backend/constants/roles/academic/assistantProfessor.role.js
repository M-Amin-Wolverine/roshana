// ==========================================
// academic/assistantProfessor.role.js
// ==========================================

const { ROLE_CATEGORIES } = require('../shared/roleCategories');
const { ROLE_PRIORITIES } = require('../shared/rolePriorities');
const { RISK_LEVELS } = require('../shared/riskLevels');
const { ACCESS_SCOPES } = require('../shared/accessScopes');

module.exports = {
    id: 'assistant_professor',

    name: 'Assistant Professor',
    displayName: 'استادیار',

    category: ROLE_CATEGORIES.ACADEMIC,
    priority: ROLE_PRIORITIES.MEDIUM,
    riskLevel: RISK_LEVELS.MEDIUM,

    scope: ACCESS_SCOPES.DEPARTMENT,

    inherits: ['professor'],

    permissions: [
        'course:assistant:manage',
        'assignment:review',
        'exam:assist',
        'student:support'
    ],

    restrictions: {
        requiresMFA: true,
        sessionTimeout: 3600
    },

    metadata: {
        color: '#EA580C',
        icon: 'ClipboardPen',
        badge: 'ASSISTANT_PROFESSOR'
    }
};