// ============================================
// 🚀 Roshana Enterprise Enum System
// ============================================

const EnumManager = require('./core/EnumManager');

const EnumUtils = require('./core/EnumUtils');

const manager = new EnumManager();

// ============================================
// 📦 Definitions
// ============================================

manager.register(
    'STATUS',
    require('./definitions/status.enum'),
    {
        category: 'system'
    }
);

manager.register(
    'ROLES',
    require('./definitions/roles.enum'),
    {
        category: 'auth'
    }
);

manager.register(
    'PERMISSIONS',
    require('./definitions/permissions.enum'),
    {
        category: 'auth'
    }
);

manager.register(
    'RESOURCES',
    require('./definitions/resources.enum'),
    {
        category: 'system'
    }
);

manager.register(
    'HTTP',
    require('./definitions/http.enum'),
    {
        category: 'network'
    }
);

manager.register(
    'NOTIFICATIONS',
    require('./definitions/notifications.enum'),
    {
        category: 'system'
    }
);

// ============================================
// ⚡ Proxy Access
// ============================================

const Enums = new Proxy({}, {

    get(target, prop) {

        if (typeof prop !== 'string') {
            return undefined;
        }

        if (!manager.has(prop)) {
            return undefined;
        }

        return manager.get(prop);
    }
});

// ============================================
// 📤 Exports
// ============================================

module.exports = {

    manager,

    Enums,

    utils: EnumUtils,

    Status: manager.get('STATUS'),

    Roles: manager.get('ROLES'),

    Permissions: manager.get('PERMISSIONS'),

    Resources: manager.get('RESOURCES'),

    Http: manager.get('HTTP'),

    Notifications: manager.get('NOTIFICATIONS'),

    stats: () => manager.stats(),

    version: '4.0.0'
};