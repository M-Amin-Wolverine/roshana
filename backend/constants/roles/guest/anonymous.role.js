const anonymousRole = {
    id: 'anonymous',

    name: 'Anonymous Visitor',

    category: 'guest',

    description: 'Unauthenticated public visitor',

    priority: 0,

    inherits: [],

    permissions: [
        'public:view'
    ],

    additionalPermissions: [],

    restrictions: [
        '*'
    ],

    riskLevel: 'low',

    accessScope: 'public',

    isSystem: true,

    auditRequired: false,

    sessionPolicy: {
        maxSessions: 1,
        requireMFA: false
    }
};

module.exports = anonymousRole;