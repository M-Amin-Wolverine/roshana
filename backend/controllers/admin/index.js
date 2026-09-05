module.exports = {};
// ======================================================
// FILE: backend/controllers/admin/index.js
// BADASS PRO MAX ULTRA ADMIN CONTROLLER REGISTRY
// ======================================================

const authController = require('./authController');
const automationController = require('./automationController');
const classroomController = require('./classroomController');
const contentController = require('./contentController');
const coursewareController = require('./coursewareController');
const dashboardController = require('./dashboardController');
const liveController = require('./liveController');
const messengerController = require('./messengerController');
const newsController = require('./newsController');
const roshanaSciController = require('./roshanaSciController');
const settingsController = require('./settingsController');
const userManagementController = require('./userManagementController');

module.exports = {
    // =========================================
    // AUTH
    // =========================================
    auth: authController,

    // =========================================
    // AUTOMATION
    // =========================================
    automation: automationController,

    // =========================================
    // CLASSROOM
    // =========================================
    classroom: classroomController,

    // =========================================
    // CONTENT
    // =========================================
    content: contentController,

    // =========================================
    // COURSEWARE
    // =========================================
    courseware: coursewareController,

    // =========================================
    // DASHBOARD
    // =========================================
    dashboard: dashboardController,

    // =========================================
    // LIVE
    // =========================================
    live: liveController,

    // =========================================
    // MESSENGER
    // =========================================
    messenger: messengerController,

    // =========================================
    // NEWS
    // =========================================
    news: newsController,

    // =========================================
    // ROSHANA SCI
    // =========================================
    roshanaSci: roshanaSciController,

    // =========================================
    // SETTINGS
    // =========================================
    settings: settingsController,

    // =========================================
    // USER MANAGEMENT
    // =========================================
    users: userManagementController,

    // =========================================
    // SYSTEM META
    // =========================================
    meta: {
        version: '3.0.0',
        codename: 'BADASS_PRO_MAX_ULTRA',
        initializedAt: new Date(),
        modules: [
            'auth',
            'automation',
            'classroom',
            'content',
            'courseware',
            'dashboard',
            'live',
            'messenger',
            'news',
            'roshanaSci',
            'settings',
            'users'
        ]
    }
};