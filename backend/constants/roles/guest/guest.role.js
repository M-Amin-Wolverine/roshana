const guestRole = {
    id: 'guest',

    name: 'Guest User',

    category: 'guest',

    description: 'Limited guest access',

    priority: 50,

    inherits: [],

    permissions: [
        'content:view',
        'public:view',
        'stream:watch'
    ],

    additionalPermissions: [],

    restrictions: [
        'users:update',
        'roles:update',
        'billing:manage'
    ],

    riskLevel: 'low',

    accessScope: 'public',

    isSystem: false,

    auditRequired: false,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: false
    }
};

module.exports = guestRole;