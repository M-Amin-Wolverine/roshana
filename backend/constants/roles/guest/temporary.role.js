const temporaryRole = {
    id: 'temporary',

    name: 'Temporary Access',

    category: 'guest',

    description: 'Short-term temporary access role',

    priority: 120,

    inherits: ['guest'],

    permissions: [
        'temporary:view',
        'temporary:access',
        'stream:watch',
        'events:view'
    ],

    additionalPermissions: [
        'chat:temporary'
    ],

    restrictions: [
        'roles:update',
        'users:delete',
        'billing:manage'
    ],

    riskLevel: 'medium',

    accessScope: 'session',

    isSystem: false,

    auditRequired: true,

    expiresIn: '24h',

    sessionPolicy: {
        maxSessions: 1,
        requireMFA: false
    }
};

module.exports = temporaryRole;