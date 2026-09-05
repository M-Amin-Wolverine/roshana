const organizationManagerRole = {
    id: 'organization_manager',

    name: 'Organization Manager',

    category: 'organization',

    description: 'Manages organization structure and operations',

    priority: 600,

    inherits: ['organization_moderator'],

    permissions: [
        'organization:update',
        'organization:manage',
        'members:invite',
        'members:remove',
        'events:create',
        'events:update',
        'analytics:organization'
    ],

    additionalPermissions: [
        'roles:assign',
        'reports:export'
    ],

    restrictions: [
        'organization:transfer_ownership'
    ],

    riskLevel: 'high',

    accessScope: 'organization',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 3,
        requireMFA: true
    },

    metadata: {
        immutable: false
    }
};

module.exports = organizationManagerRole;