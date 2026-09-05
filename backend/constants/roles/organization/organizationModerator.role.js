const organizationModeratorRole = {
    id: 'organization_moderator',

    name: 'Organization Moderator',

    category: 'organization',

    description: 'Moderates organization activities and discussions',

    priority: 450,

    inherits: ['organization_member'],

    permissions: [
        'organization:view',
        'organization:moderate',
        'chat:moderate',
        'events:manage',
        'members:warn',
        'reports:review'
    ],

    additionalPermissions: [
        'members:mute',
        'content:remove'
    ],

    restrictions: [
        'organization:delete',
        'billing:update'
    ],

    riskLevel: 'medium',

    accessScope: 'organization',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 4,
        requireMFA: false
    },

    metadata: {
        immutable: false
    }
};

module.exports = organizationModeratorRole;