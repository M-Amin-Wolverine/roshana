const BASE_PERMISSIONS = Object.freeze({

    SYSTEM: [
        'system:view',
        'system:health',
        'system:status'
    ],

    USER: [
        'users:view',
        'users:create',
        'users:update',
        'users:delete'
    ],

    ROLE: [
        'roles:view',
        'roles:create',
        'roles:update',
        'roles:delete'
    ],

    SECURITY: [
        'security:view',
        'security:manage',
        'security:audit'
    ],

    AUDIT: [
        'audit:view',
        'audit:export'
    ],

    ANALYTICS: [
        'analytics:view',
        'analytics:export'
    ],

    COURSE: [
        'course:view',
        'course:create',
        'course:update',
        'course:delete'
    ],

    LIVE: [
        'live:view',
        'live:start',
        'live:manage'
    ]
});

module.exports = BASE_PERMISSIONS;