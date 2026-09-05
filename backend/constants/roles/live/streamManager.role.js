const streamManagerRole = {
    id: 'stream_manager',

    name: 'Stream Manager',

    category: 'live',

    description: 'Manages streaming infrastructure and sessions',

    priority: 750,

    inherits: ['presenter', 'moderator'],

    permissions: [
        'stream:full_control',
        'stream:analytics',
        'stream:quality_control',
        'stream:terminate',
        'live:schedule',
        'cdn:manage'
    ],

    additionalPermissions: [
        'stream:priority_access',
        'bandwidth:optimize'
    ],

    restrictions: [
        'database:delete'
    ],

    riskLevel: 'high',

    accessScope: 'global',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true
    }
};

module.exports = streamManagerRole;