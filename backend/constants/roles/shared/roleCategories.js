const ROLE_CATEGORIES = Object.freeze({

    SYSTEM: 'system',

    ACADEMIC: 'academic',

    ORGANIZATION: 'organization',

    LIVE: 'live',

    FINANCE: 'finance',

    SECURITY: 'security',

    GUEST: 'guest'
});

const ROLE_GROUPS = {

    privileged: [
        'super_admin',
        'admin',
        'security_operator'
    ],

    operational: [
        'support',
        'system_operator',
        'moderator'
    ],

    academic: [
        'student',
        'elite_student',
        'professor',
        'dean'
    ],

    public: [
        'guest',
        'anonymous'
    ]
};

module.exports = ROLE_GROUPS;
module.exports = ROLE_CATEGORIES;