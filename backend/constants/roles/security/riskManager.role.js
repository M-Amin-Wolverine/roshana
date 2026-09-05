const riskManagerRole = {
    id: 'risk_manager',

    name: 'Risk Manager',

    category: 'security',

    description: 'Responsible for operational and security risk management',

    priority: 700,

    inherits: ['security_analyst'],

    permissions: [
        'risk:view',
        'risk:assess',
        'risk:reports',
        'compliance:view',
        'analytics:risk',
        'audit:view'
    ],

    additionalPermissions: [
        'exports:risk_reports',
        'security:recommendations'
    ],

    restrictions: [
        'users:delete',
        'database:drop'
    ],

    riskLevel: 'high',

    accessScope: 'organization',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true
    },

    metadata: {
        immutable: false,
        department: 'risk_management'
    }
};

module.exports = riskManagerRole;