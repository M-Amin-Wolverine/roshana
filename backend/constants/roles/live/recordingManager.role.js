const recordingManagerRole = {
    id: 'recording_manager',

    name: 'Recording Manager',

    category: 'live',

    description: 'Handles recordings, archives and media storage',

    priority: 550,

    inherits: ['viewer'],

    permissions: [
        'recording:view',
        'recording:start',
        'recording:stop',
        'recording:archive',
        'media:manage'
    ],

    additionalPermissions: [
        'recording:download',
        'recording:export'
    ],

    restrictions: [
        'stream:terminate',
        'roles:update'
    ],

    riskLevel: 'medium',

    accessScope: 'organization',

    isSystem: false,

    auditRequired: true,

    sessionPolicy: {
        maxSessions: 3,
        requireMFA: false
    }
};

module.exports = recordingManagerRole;