const securityAnalystRole = {
    id: 'security_analyst',

    name: 'Security Analyst',

    category: 'security',

    description: 'Analyzes threats, logs and suspicious activities',

    priority: 750,

    inherits: [],

    permissions: [
        'security:view',
        'security:reports',
        'logs:view',
        'threats:view',
        'audit:view',
        'analytics:security'
    ],

    additionalPermissions: [
        'exports:security_reports'
    ],

    restrictions: [
        'users:delete',
        'roles:update',
        'system:shutdown'
    ],

    riskLevel: 'medium',

    accessScope: 'global',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 3,
        requireMFA: true
    },

    metadata: {
        immutable: false,
        department: 'security'
    }
};

module.exports = securityAnalystRole;