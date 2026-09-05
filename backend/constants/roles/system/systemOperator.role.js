const systemOperatorRole = {
    id: 'system_operator',

    name: 'System Operator',

    category: 'system',

    description: 'Infrastructure and operations management',

    priority: 700,

    inherits: ['support'],

    permissions: [
        'servers:monitor',
        'services:restart',
        'queue:manage',
        'cache:clear',
        'system:health',
        'deployments:view'
    ],

    additionalPermissions: [
        'containers:restart',
        'backups:create'
    ],

    restrictions: [
        'database:delete',
        'users:delete'
    ],

    riskLevel: 'high',

    accessScope: 'infrastructure',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true,
        trustedDevicesOnly: true
    }
};

module.exports = systemOperatorRole;