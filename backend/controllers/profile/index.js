module.exports = {

    controller: require('./profile.controller'),

    services: {
        profileService: require('./services/profile.service'),
        verificationService: require('./services/verification.service'),
        socialService: require('./services/social.service'),
        preferenceService: require('./services/preference.service'),
        dataService: require('./services/data.service'),
        uploadService: require('./services/upload.service'),
        securityService: require('./services/security.service'),
        sessionService: require('./services/session.service')
    },

    repositories: {
        profileRepository: require('./repositories/profile.repository'),
        socialRepository: require('./repositories/social.repository'),
        activityRepository: require('./repositories/activity.repository')
    },

    validators: {
        profileValidator: require('./validators/profile.validator'),
        securityValidator: require('./validators/security.validator'),
        settingsValidator: require('./validators/settings.validator')
    },

    middlewares: {
        uploadMiddleware: require('./middlewares/upload.middleware'),
        privacyMiddleware: require('./middlewares/privacy.middleware')
    }
};
