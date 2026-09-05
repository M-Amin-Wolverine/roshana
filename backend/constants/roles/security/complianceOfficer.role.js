const complianceOfficerRole = {
    id: 'compliance_officer',

    name: 'Compliance Officer',

    category: 'security',

    description: 'Ensures regulatory and policy compliance',

    priority: 680,

    inherits: ['auditor'],

    permissions: [
        'compliance:view',
        'compliance:audit',
        'compliance:reports',
        'policies:view',
        'audit:view',
        'documents:review'
    ],

    additionalPermissions: [
        'exports:compliance_reports'
    ],

    restrictions: [
        'system:shutdown',
        'users:delete',
        'roles:delete'
    ],

    riskLevel: 'medium',

    accessScope: 'global',

    isSystem: true,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 2,
        requireMFA: true
    },

    metadata: {
        immutable: false,
        department: 'compliance'
    }
};

module.exports = complianceOfficerRole;