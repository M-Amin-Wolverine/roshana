const superAdminRole = {
    id: 'super_admin',

    name: 'Super Administrator',

    category: 'system',

    description: 'Full unrestricted system access',

    priority: 1000,

    inherits: ['admin'],

    permissions: [
        '*'
    ],

    additionalPermissions: [
        'system:shutdown',
        'system:restart',
        'security:bypass',
        'database:full_access'
    ],

    restrictions: [],

    riskLevel: 'critical',

    accessScope: 'global',

    isSystem: true,

    isAssignable: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true,
        ipWhitelistOnly: true
    },

    metadata: {
        createdBy: 'system',
        immutable: true
    }
};

module.exports = superAdminRole;