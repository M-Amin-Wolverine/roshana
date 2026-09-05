const moderatorRole = {
    id: 'moderator',

    name: 'Live Moderator',

    category: 'live',

    description: 'Moderates live sessions and audience activity',

    priority: 450,

    inherits: ['viewer'],

    permissions: [
        'chat:moderate',
        'users:mute',
        'users:remove',
        'stream:moderate',
        'reports:review'
    ],

    additionalPermissions: [
        'chat:slowmode',
        'chat:pin_message'
    ],

    restrictions: [
        'stream:end',
        'billing:update'
    ],

    riskLevel: 'medium',

    accessScope: 'session',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 5,
        requireMFA: false
    }
};

module.exports = moderatorRole;