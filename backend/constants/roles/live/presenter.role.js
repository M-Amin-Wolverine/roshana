const presenterRole = {
    id: 'presenter',

    name: 'Presenter',

    category: 'live',

    description: 'Can create and manage live sessions',

    priority: 600,

    inherits: ['viewer'],

    permissions: [
        'stream:start',
        'stream:end',
        'stream:manage',
        'live:present',
        'screen:share',
        'recording:start'
    ],

    additionalPermissions: [
        'poll:create',
        'announcements:create'
    ],

    restrictions: [
        'roles:update',
        'system:shutdown'
    ],

    riskLevel: 'high',

    accessScope: 'session',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 3,
        requireMFA: true
    }
};

module.exports = presenterRole;