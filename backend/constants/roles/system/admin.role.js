const adminRole = {
    id: 'admin',

    name: 'Administrator',

    category: 'system',

    description: 'System administration role',

    priority: 900,

    inherits: ['support', 'auditor'],

    permissions: [
        'users:*',
        'roles:*',
        'permissions:*',
        'dashboard:*',
        'analytics:view',
        'system:monitor'
    ],

    additionalPermissions: [
        'logs:view',
        'settings:update'
    ],

    restrictions: [],

    riskLevel: 'high',

    accessScope: 'global',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 3,
        requireMFA: true
    }
};

module.exports = adminRole;