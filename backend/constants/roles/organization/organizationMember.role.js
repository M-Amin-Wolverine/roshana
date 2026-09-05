const organizationMemberRole = {
    id: 'organization_member',

    name: 'Organization Member',

    category: 'organization',

    description: 'Basic member access inside organizations',

    priority: 300,

    inherits: [],

    permissions: [
        'organization:view',
        'organization:join',
        'events:view',
        'events:participate',
        'chat:organization'
    ],

    additionalPermissions: [
        'profile:update'
    ],

    restrictions: [
        'organization:delete',
        'roles:update'
    ],

    riskLevel: 'low',

    accessScope: 'organization',

    isSystem: false,

    auditRequired: false,

    sessionPolicy: {
        maxSessions: 5,
        requireMFA: false
    },

    metadata: {
        immutable: false
    }
};

module.exports = organizationMemberRole;