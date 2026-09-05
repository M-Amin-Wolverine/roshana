const userService = require('./services/user.service');
const analyticsService = require('./services/analytics.service');
const profileService = require('./services/profile.service');
const securityService = require('./services/security.service');
const sessionService = require('./services/session.service');
const notificationService = require('./services/notification.service');
const webhookService = require('./services/webhook.service');
const rbacService = require('./services/rbac.service');

module.exports = {

    async getAllUsers(req, res, next) {
        try {
            const result = await userService.getAllUsers(req.query);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

};
