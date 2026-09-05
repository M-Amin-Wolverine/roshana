
module.exports = {

    controller: require('./auth.controller'),

    services: {

        authService: require('./services/auth.service'),
        otpService: require('./services/otp.service'),
        tokenService: require('./services/token.service'),
        sessionService: require('./services/session.service'),
        passwordService: require('./services/password.service'),
        securityService: require('./services/security.service'),
        profileService: require('./services/profile.service'),
        analyticsService: require('./services/analytics.service'),
        notificationService: require('./services/notification.service')
    },

    repositories: {

        authRepository: require('./repositories/auth.repository'),
        otpRepository: require('./repositories/otp.repository'),
        sessionRepository: require('./repositories/session.repository'),
        userRepository: require('./repositories/user.repository')
    },

    middlewares: {

        authMiddleware: require('./middlewares/auth.middleware'),
        securityMiddleware: require('./middlewares/security.middleware'),
        rateLimitMiddleware: require('./middlewares/rateLimit.middleware')
    }
};

