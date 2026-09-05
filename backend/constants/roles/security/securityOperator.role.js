const securityOperatorRole = {
    id: 'security_operator',

    name: 'Security Operator',

    category: 'security',

    description: 'Handles active security operations and incident response',

    priority: 850,

    inherits: ['security_analyst'],

    permissions: [
        'security:monitor',
        'security:incident_response',
        'security:block_ip',
        'security:manage_alerts',
        'logs:view',
        'threats:analyze'
    ],

    additionalPermissions: [
        'sessions:terminate',
        'firewall:update',
        'devices:isolate'
    ],

    restrictions: [
        'database:delete',
        'billing:update'
    ],

    riskLevel: 'high',

    accessScope: 'global',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true,
        trustedDevicesOnly: true
    },

    metadata: {
        immutable: false,
        department: 'security'
    }
};

module.exports = securityOperatorRole;