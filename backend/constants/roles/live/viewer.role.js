const viewerRole = {
    id: 'viewer',

    name: 'Viewer',

    category: 'live',

    description: 'Basic live stream viewer access',

    priority: 100,

    inherits: [],

    permissions: [
        'live:view',
        'stream:watch',
        'chat:view',
        'reactions:send'
    ],

    additionalPermissions: [
        'profile:view'
    ],

    restrictions: [
        'stream:start',
        'stream:moderate'
    ],

    riskLevel: 'low',

    accessScope: 'session',

    isSystem: false,

    auditRequired: false,

    sessionPolicy: {
        maxSessions: 10,
        requireMFA: false
    }
};

module.exports = viewerRole;