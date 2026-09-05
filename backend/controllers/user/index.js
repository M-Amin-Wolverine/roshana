
module.exports = {
    controller: require('./user.controller'),

    services: {
        user: require('./services/user.service'),
        auth: require('./services/auth.service'),
        profile: require('./services/profile.service'),
        security: require('./services/security.service'),
        session: require('./services/session.service'),
        notification: require('./services/notification.service'),
        analytics: require('./services/analytics.service'),
        rbac: require('./services/rbac.service'),
        webhook: require('./services/webhook.service'),
        sync: require('./services/sync.service')
    }
};

