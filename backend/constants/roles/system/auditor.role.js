const auditorRole = {
    id: 'auditor',

    name: 'Security Auditor',

    category: 'system',

    description: 'Audit and compliance access',

    priority: 650,

    inherits: [],

    permissions: [
        'audit:view',
        'logs:view',
        'analytics:view',
        'security:reports',
        'compliance:view'
    ],

    additionalPermissions: [
        'exports:audit'
    ],

    restrictions: [
        'users:update',
        'roles:update',
        'settings:update'
    ],

    riskLevel: 'medium',

    accessScope: 'global',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true
    }
};

module.exports = auditorRole;