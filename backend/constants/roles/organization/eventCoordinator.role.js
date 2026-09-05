const eventCoordinatorRole = {
    id: 'event_coordinator',

    name: 'Event Coordinator',

    category: 'organization',

    description: 'Handles event planning and execution',

    priority: 500,

    inherits: ['organization_member'],

    permissions: [
        'events:create',
        'events:update',
        'events:manage',
        'events:participants',
        'live:schedule',
        'announcements:create'
    ],

    additionalPermissions: [
        'tickets:manage',
        'stream:coordinate'
    ],

    restrictions: [
        'organization:delete',
        'roles:update'
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

module.exports = eventCoordinatorRole;