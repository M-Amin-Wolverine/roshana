const organizationOwnerRole = {
    id: 'organization_owner',

    name: 'Organization Owner',

    category: 'organization',

    description: 'Full ownership access for organizations',

    priority: 800,

    inherits: ['organization_manager'],

    permissions: [
        'organization:full_access',
        'organization:delete',
        'organization:transfer_ownership',
        'billing:manage',
        'roles:full_access',
        'analytics:advanced'
    ],

    additionalPermissions: [
        'security:organization_settings',
        'members:all_permissions'
    ],

    restrictions: [],

    riskLevel: 'critical',

    accessScope: 'organization',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true,
        trustedDevicesOnly: true
    },

    metadata: {
        immutable: false
    }
};

module.exports = organizationOwnerRole;