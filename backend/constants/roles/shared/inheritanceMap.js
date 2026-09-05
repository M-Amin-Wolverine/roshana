const INHERITANCE_MAP = Object.freeze({

    super_admin: [
        'admin'
    ],

    admin: [
        'support',
        'auditor'
    ],

    system_operator: [
        'support'
    ],

    elite_student: [
        'student'
    ],

    dean: [
        'professor'
    ],

    organization_owner: [
        'organization_manager'
    ],

    organization_manager: [
        'organization_moderator'
    ],

    organization_moderator: [
        'organization_member'
    ],

    stream_manager: [
        'presenter'
    ]
});

module.exports = INHERITANCE_MAP;