const supportRole = {
    id: 'support',

    name: 'Support Agent',

    category: 'system',

    description: 'Customer and technical support role',

    priority: 500,

    inherits: [],

    permissions: [
        'tickets:view',
        'tickets:reply',
        'users:view',
        'chat:support',
        'reports:view'
    ],

    additionalPermissions: [
        'sessions:view'
    ],

    restrictions: [
        'users:delete',
        'roles:update'
    ],

    riskLevel: 'medium',

    accessScope: 'department',

    isSystem: true,

    auditRequired: false,

    sessionPolicy: {
        maxSessions: 5,
        requireMFA: false
    }
};

module.exports = supportRole;